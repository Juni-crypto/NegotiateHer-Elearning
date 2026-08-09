#!/usr/bin/env node
/*
 * extract-drive-ids.mjs
 * ---------------------------------------------------------------------------
 * Pulls Google Drive file IDs out of whatever the client handed over — a dump
 * of <iframe> embed HTML, a CSV of share links, an exported sheet — and emits
 * a course-data.js skeleton you can paste over the `modules` array.
 *
 *   node tools/extract-drive-ids.mjs embeds.html
 *   node tools/extract-drive-ids.mjs embeds.html links.csv > scaffold.txt
 *
 * Handles every Drive URL shape in the wild:
 *   /file/d/<ID>/preview      /file/d/<ID>/view       /open?id=<ID>
 *   /uc?id=<ID>&export=...    docs.google.com/file/d/<ID>
 *
 * It also tries to guess a lesson title from nearby text so you are editing
 * labels rather than typing them from scratch. Always eyeball the output.
 */

import { readFileSync } from 'node:fs';

const files = process.argv.slice(2);

if (files.length === 0) {
  console.error('usage: node tools/extract-drive-ids.mjs <file> [file...]');
  console.error('       accepts HTML, CSV, TSV, JSON, or plain text');
  process.exit(1);
}

/* Drive IDs are 25+ chars of [A-Za-z0-9_-]. Older ones can be shorter, so we
 * accept 20+ and let the dedupe/eyeball step catch anything odd. */
const ID = '([a-zA-Z0-9_-]{20,})';
const PATTERNS = [
  new RegExp(`/file/d/${ID}`, 'g'),
  new RegExp(`/d/${ID}`, 'g'),
  new RegExp(`[?&]id=${ID}`, 'g'),
];

/* Strip tags, entities and separators so a chunk of markup becomes a plausible
 * human title. Returns '' when nothing usable survives. */
function clean(chunk) {
  const out = chunk
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#\d+;/g, ' ')
    .replace(/https?:\S*/g, ' ')
    .replace(/[|,;\t]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  // Needs at least one real word, or it's attribute debris.
  return /[a-zA-Z]{3}/.test(out) ? out.slice(0, 80) : '';
}

/* Find the tag the match sits inside, so we can tell an <a href> (whose label
 * follows the URL) from an <iframe src> (whose label precedes it). */
function tagContaining(source, matchIndex) {
  const start = source.lastIndexOf('<', matchIndex);
  const end = source.indexOf('>', matchIndex);
  if (start === -1 || end === -1) return null;
  return { start, end, raw: source.slice(start, Math.min(end + 1, start + 200)) };
}

/*
 * Guess a lesson title, in descending order of how tight the signal is:
 *   1. the link text, when the ID is inside an <a href>
 *   2. the nearest preceding heading
 *   3. the nearest preceding run of text between tags
 *   4. the last non-empty line (covers CSV/TSV/plain-text input)
 */
function guessTitle(source, matchIndex) {
  const tag = tagContaining(source, matchIndex);

  if (tag && /^<a[\s>]/i.test(tag.raw)) {
    const close = source.indexOf('</a', tag.end);
    if (close !== -1 && close - tag.end < 300) {
      const label = clean(source.slice(tag.end + 1, close));
      if (label) return label;
    }
  }

  const from = tag ? tag.start : matchIndex;
  const before = source.slice(Math.max(0, from - 600), from);

  const headings = [...before.matchAll(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi)];
  if (headings.length) {
    const label = clean(headings[headings.length - 1][1]);
    if (label) return label;
  }

  const chunks = [...before.matchAll(/>([^<>]{3,120})</g)];
  for (let i = chunks.length - 1; i >= 0; i--) {
    const label = clean(chunks[i][1]);
    if (label) return label;
  }

  const lines = before.split(/[\r\n]+/);
  for (let i = lines.length - 1; i >= 0; i--) {
    const label = clean(lines[i]);
    if (label) return label;
  }

  return '';
}

const seen = new Map(); // driveId -> { title, sources:Set }

for (const file of files) {
  let source;
  try {
    source = readFileSync(file, 'utf8');
  } catch (err) {
    console.error(`! could not read ${file}: ${err.message}`);
    continue;
  }

  for (const pattern of PATTERNS) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(source)) !== null) {
      const id = match[1];
      if (!seen.has(id)) {
        seen.set(id, { title: guessTitle(source, match.index), sources: new Set() });
      }
      seen.get(id).sources.add(file);
      // A better title from a later file is still an upgrade over nothing.
      const record = seen.get(id);
      if (!record.title) record.title = guessTitle(source, match.index);
    }
  }
}

const ids = [...seen.entries()];

if (ids.length === 0) {
  console.error('No Drive file IDs found. Check the input actually contains Drive links.');
  process.exit(2);
}

// --- Report ---------------------------------------------------------------

console.log(`// ${ids.length} unique Drive file ID(s) found in ${files.length} file(s).`);
console.log('//');
console.log('// NEXT STEPS');
console.log('//   1. Download the originals:');
console.log('//        rclone copy "gdrive:Course Videos" ./downloads --progress');
console.log('//   2. Upload to the @NegotiateHer channel via YouTube Studio.');
console.log('//      Bulk-select -> Visibility: Unlisted. Do NOT use the API:');
console.log('//      videos.insert costs 1600 of a 10,000/day quota (~6 uploads/day).');
console.log('//   3. Paste each YouTube ID into the youtubeId fields below.');
console.log('//   4. Drop the result into course-data.js, replacing `modules`.');
console.log('//');
console.log('// Grouping is a guess — reorder these into the right modules.');
console.log('');

console.log('  modules: [');
console.log('    {');
console.log("      id: 'm1',");
console.log('      number: 1,');
console.log("      title: 'A Structured Approach',");
console.log("      description: '',");
console.log('      lessons: [');

ids.forEach(([driveId, meta], i) => {
  const title = (meta.title || `Lesson ${i + 1}`).replace(/'/g, "\\'");
  console.log(
    `        { id: 'm1l${i + 1}', title: '${title}', ` +
    `youtubeId: '', minutes: 0, driveId: '${driveId}' },`
  );
});

console.log('      ],');
console.log('    },');
console.log('  ],');
console.log('');
console.log('// --- Drive IDs only (for rclone / scripting) ---');
ids.forEach(([driveId]) => console.log(`// ${driveId}`));
