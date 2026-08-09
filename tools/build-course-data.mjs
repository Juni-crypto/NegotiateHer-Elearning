#!/usr/bin/env node
/*
 * build-course-data.mjs
 * ---------------------------------------------------------------------------
 * Writes course-data.js by combining two sources:
 *
 *   1. the prepared video folder  — the authoritative course structure.
 *      Filenames are "M<module>L<lesson> - Title (Part i of n).mp4", and
 *      ffprobe gives the real duration of each.
 *   2. a list of YouTube video IDs — matched onto that structure by the
 *      M#L# prefix in each video's title, fetched via YouTube's oEmbed
 *      endpoint (no API key, no quota, works on unlisted videos).
 *
 * Structure comes from disk, so a lesson that hasn't been uploaded yet simply
 * gets an empty youtubeId and renders as "Coming soon" — the course page stays
 * shippable while the rest of the upload finishes.
 *
 *   node tools/build-course-data.mjs --ids ids.txt              # preview
 *   node tools/build-course-data.mjs --ids ids.txt --write      # overwrite
 *
 * ids.txt takes one per line, as a bare ID or any YouTube URL form.
 */

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, '..', 'course-data.js');
const VIDEO_DIR_DEFAULT = '/Users/juni/Personal/Elearning-modules/ready-to-upload';

const argv = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = argv.indexOf(name);
  return i !== -1 && argv[i + 1] ? argv[i + 1] : fallback;
};

const idsFile = flag('--ids', null);
const videoDir = flag('--videos', VIDEO_DIR_DEFAULT);
const write = argv.includes('--write');

if (!idsFile) {
  console.error('usage: node tools/build-course-data.mjs --ids <file> [--videos <dir>] [--write]');
  process.exit(1);
}

// --- 1. Course structure, from the prepared video folder --------------------

const FILE_RE = /^M(\d+)L(\d+)\s*-\s*(.+?)\.mp4$/i;

let files;
try {
  files = readdirSync(videoDir).filter((f) => f.toLowerCase().endsWith('.mp4'));
} catch (err) {
  console.error(`Cannot read video folder ${videoDir}: ${err.message}`);
  process.exit(1);
}

const lessons = [];
for (const f of files) {
  const m = f.match(FILE_RE);
  if (!m) {
    console.error(`  skipping unrecognised filename: ${f}`);
    continue;
  }
  let seconds = 0;
  try {
    const out = execFileSync(
      'ffprobe',
      ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', join(videoDir, f)],
      { encoding: 'utf8' }
    ).trim();
    seconds = parseFloat(out) || 0;
  } catch {
    // ffprobe missing or unreadable file — duration just shows as blank.
  }
  lessons.push({
    module: parseInt(m[1], 10),
    lesson: parseInt(m[2], 10),
    title: m[3].trim(),
    minutes: seconds ? Math.max(1, Math.round(seconds / 60)) : 0,
    youtubeId: '',
  });
}

if (!lessons.length) {
  console.error('No M#L# named videos found. Run prepare-uploads.py first.');
  process.exit(2);
}

lessons.sort((a, b) => a.module - b.module || a.lesson - b.lesson);
console.error(`Structure: ${lessons.length} lessons from ${videoDir}`);

// --- 2. YouTube IDs, matched on by title prefix -----------------------------

const ids = readFileSync(idsFile, 'utf8')
  .split('\n')
  .map((l) => l.trim())
  .filter(Boolean)
  .map((l) => {
    const m =
      l.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([A-Za-z0-9_-]{6,})/) ||
      l.match(/^([A-Za-z0-9_-]{6,})$/);
    return m ? m[1] : null;
  })
  .filter(Boolean);

console.error(`Resolving ${ids.length} YouTube ID(s) via oEmbed…`);

/* YouTube strips "-" and "()" from filenames when it derives a title, so
 * "M7L3 - Engage Actively (Part 3 of 6)" comes back as
 * "M7L3   Engage Actively Part 3 of 6". Only the M#L# prefix is needed. */
const TITLE_RE = /^\s*M(\d+)\s*L(\d+)\b/i;

let matched = 0;
const unmatched = [];

for (const id of ids) {
  const url = `https://www.youtube.com/oembed?url=https://youtu.be/${id}&format=json`;
  let title = null;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      unmatched.push(`${id} (HTTP ${res.status} — private or deleted?)`);
      continue;
    }
    title = (await res.json()).title || '';
  } catch (err) {
    unmatched.push(`${id} (${err.message})`);
    continue;
  }

  const m = title.match(TITLE_RE);
  if (!m) {
    unmatched.push(`${id} — title has no M#L# prefix: "${title}"`);
    continue;
  }
  const target = lessons.find(
    (l) => l.module === parseInt(m[1], 10) && l.lesson === parseInt(m[2], 10)
  );
  if (!target) {
    unmatched.push(`${id} — M${m[1]}L${m[2]} has no matching file`);
    continue;
  }
  if (target.youtubeId) {
    unmatched.push(`${id} — M${m[1]}L${m[2]} already claimed by ${target.youtubeId}`);
    continue;
  }
  target.youtubeId = id;
  matched++;
}

const pending = lessons.filter((l) => !l.youtubeId);
console.error(`Matched ${matched}/${lessons.length}.`);
if (unmatched.length) {
  console.error('\nUnmatched IDs:');
  unmatched.forEach((u) => console.error('  ' + u));
}
if (pending.length) {
  console.error(`\nStill awaiting upload (${pending.length}) — these render as "Coming soon":`);
  pending.forEach((l) => console.error(`  M${l.module}L${l.lesson} - ${l.title}`));
}

// --- 3. Emit ----------------------------------------------------------------

const esc = (s) => String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");

/* Lesson titles carry a "(Part i of n)" tail; the module title is what's
 * left once it's removed. Tolerates the parens being absent. */
const stripPart = (t) => t.replace(/\s*\(?Part\s+\d+\s+of\s+\d+\)?\s*$/i, '').trim();

const moduleNumbers = [...new Set(lessons.map((l) => l.module))].sort((a, b) => a - b);

const blocks = moduleNumbers.map((n) => {
  const items = lessons.filter((l) => l.module === n);
  const rows = items
    .map(
      (l, i) =>
        `        { id: 'm${n}l${i + 1}', title: '${esc(l.title)}', ` +
        `youtubeId: '${esc(l.youtubeId)}', minutes: ${l.minutes}, driveId: '' },`
    )
    .join('\n');
  return [
    '    {',
    `      id: 'm${n}',`,
    `      number: ${n},`,
    `      title: '${esc(stripPart(items[0].title))}',`,
    `      description: '',`,
    '      lessons: [',
    rows,
    '      ],',
    '    },',
  ].join('\n');
});

let header = null;
try {
  const existing = readFileSync(OUT, 'utf8');
  const end = existing.indexOf('*/');
  if (end !== -1) header = existing.slice(0, end + 2);
} catch {
  /* first run — no existing file to take the header comment from */
}

const output = `${header ? header + '\n\n' : ''}const COURSE = {
  title: 'Strategic Career Negotiations',
  subtitle: 'A step-by-step framework to navigate any negotiation — free, self-paced.',

  modules: [
${blocks.join('\n')}
  ],
};

/* Flat lesson list in course order — used for next/prev and progress totals. */
COURSE.flatLessons = COURSE.modules.flatMap((m) =>
  m.lessons.map((l) => ({ ...l, moduleId: m.id, moduleNumber: m.number, moduleTitle: m.title }))
);
`;

if (write) {
  writeFileSync(OUT, output, 'utf8');
  console.error(`\nWrote ${OUT} — ${moduleNumbers.length} modules, ${lessons.length} lessons.`);
} else {
  process.stdout.write(output);
  console.error('\n(preview only — re-run with --write)');
}
