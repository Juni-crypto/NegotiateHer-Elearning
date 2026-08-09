#!/usr/bin/env python3
"""
prepare-uploads.py
---------------------------------------------------------------------------
Turns the raw Google Drive download (split .zip parts, every file duplicated)
into a clean folder of uniquely-named videos ready to drag into YouTube Studio.

    python3 tools/prepare-uploads.py --dry-run      # preview, touches nothing
    python3 tools/prepare-uploads.py                # extract + rename

What it does:
  * reads every .zip part without extracting the duplicates
  * de-duplicates by CRC, so identical content is only written once
  * parses "NN_Module_MM_Title_x_Strategic_Career_Negotiations_eLearning.mp4"
  * renames to "M<mod>L<n> - Clean Title (Part i of n).mp4"

That filename becomes the YouTube title on upload, which is what lets
build-course-data.mjs group the lessons into modules automatically.

The source module numbering skips 7 (it runs 1-6, 8, 9). By default the
modules are renumbered 1..N so learners don't see a gap; pass --keep-numbers
to preserve the original numbering instead.
"""

import argparse
import collections
import glob
import json
import os
import re
import sys
import zipfile

SRC_DEFAULT = '/Users/juni/Personal/Elearning-modules'
OUT_DEFAULT = '/Users/juni/Personal/Elearning-modules/ready-to-upload'
SUFFIX = '_Strategic_Career_Negotiations_eLearning'

# The filenames carry inconsistent casing and a stray hyphen. These are the
# only eight distinct module titles in the set, so fix them explicitly rather
# than guessing with a title-caser.
TITLE_FIXUPS = {
    'Course Overview': 'Course Overview',
    'Your Instructor': 'Your Instructor',
    'Introducing the NegotiateHer three step- detective approach':
        'Introducing the NegotiateHer Three-Step Detective Approach',
    'Know your personal values': 'Know Your Personal Values',
    "know the other person's personality": "Know the Other Person's Personality",
    'Build Empathy': 'Build Empathy',
    'Engage actively': 'Engage Actively',
    'Thank you': 'Thank You',
}


def clean_name(raw):
    """Normalise the mojibake apostrophe Drive produced, then collapse."""
    n = raw.replace('’', "'").replace('�', "'")
    n = re.sub(r"'{2,}", "'", n)
    return n


def safe_filename(s):
    """Strip anything that would break a filesystem or confuse the uploader."""
    s = s.replace('/', '-').replace(':', ' -')
    s = re.sub(r'[<>:"\\|?*]', '', s)
    return re.sub(r'\s+', ' ', s).strip()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--src', default=SRC_DEFAULT)
    ap.add_argument('--out', default=OUT_DEFAULT)
    ap.add_argument('--dry-run', action='store_true')
    ap.add_argument('--keep-numbers', action='store_true',
                    help='preserve original module numbers (leaves a gap at 7)')
    args = ap.parse_args()

    zips = sorted(glob.glob(os.path.join(args.src, '*.zip')))
    if not zips:
        sys.exit(f'No .zip files found in {args.src}')

    # ---- Collect every entry, then keep one canonical copy per CRC ----------
    entries = []
    for z in zips:
        with zipfile.ZipFile(z) as zf:
            for info in zf.infolist():
                if info.is_dir():
                    continue
                entries.append({'zip': z, 'name': info.filename,
                                'size': info.file_size, 'crc': info.CRC})

    best = {}
    for e in entries:
        # Prefer the name Drive did NOT suffix with " 2"
        penalty = 1 if re.search(r' 2\.mp4$', e['name']) else 0
        cur = best.get(e['crc'])
        if cur is None or penalty < cur[0]:
            best[e['crc']] = (penalty, e)
    unique = [v[1] for v in best.values()]

    dup_bytes = sum(e['size'] for e in entries) - sum(e['size'] for e in unique)
    print(f'{len(entries)} files in {len(zips)} archives '
          f'-> {len(unique)} unique videos')
    print(f'skipping {dup_bytes / 1e9:.1f} GB of duplicates\n')

    # ---- Parse module / lesson out of each filename ------------------------
    pat = re.compile(r'^(\d+)_Module_(\d+)_(.+?)' + re.escape(SUFFIX) + r'.*\.mp4$')
    parsed, unparsed = [], []
    for e in unique:
        m = pat.match(clean_name(e['name']))
        if not m:
            unparsed.append(e['name'])
            continue
        rest = m.group(3)
        letter = None
        lm = re.match(r'^(.*)_([a-z])$', rest)
        if lm:
            rest, letter = lm.group(1), lm.group(2)
        title = rest.replace('_', ' ').strip()
        parsed.append({**e, 'seq': int(m.group(1)), 'module': int(m.group(2)),
                       'letter': letter,
                       'title': TITLE_FIXUPS.get(title, title)})

    if unparsed:
        print('WARNING - could not parse these, they will be skipped:')
        for u in unparsed:
            print('   ', u)
        print()

    parsed.sort(key=lambda p: p['seq'])

    # ---- Group into modules, optionally closing the gap at 7 ---------------
    by_module = collections.OrderedDict()
    for p in parsed:
        by_module.setdefault(p['module'], []).append(p)

    renumber = {}
    for new, old in enumerate(sorted(by_module), start=1):
        renumber[old] = old if args.keep_numbers else new

    plan, module_map = [], {}
    for old in sorted(by_module):
        items = by_module[old]
        mod_n = renumber[old]
        module_map[mod_n] = items[0]['title']
        total = len(items)
        for idx, p in enumerate(items, start=1):
            part = f' (Part {idx} of {total})' if total > 1 else ''
            newname = safe_filename(f'M{mod_n}L{idx} - {p["title"]}{part}') + '.mp4'
            plan.append({**p, 'newname': newname, 'mod_n': mod_n, 'lesson_n': idx})

    # ---- Report ------------------------------------------------------------
    for old in sorted(by_module):
        n = renumber[old]
        label = f'Module {n}' + ('' if n == old else f'  (was Module {old})')
        print(f'{label} - {module_map[n]}')
        for p in plan:
            if p['mod_n'] == n:
                print(f'    {p["newname"]}')
        print()

    if args.dry_run:
        print('--dry-run: nothing written. Re-run without it to extract.')
        return

    # ---- Extract -----------------------------------------------------------
    os.makedirs(args.out, exist_ok=True)
    by_zip = collections.defaultdict(list)
    for p in plan:
        by_zip[p['zip']].append(p)

    done, total_files = 0, len(plan)
    for zpath, items in by_zip.items():
        with zipfile.ZipFile(zpath) as zf:
            for p in items:
                dest = os.path.join(args.out, p['newname'])
                done += 1
                if os.path.exists(dest) and os.path.getsize(dest) == p['size']:
                    print(f'[{done}/{total_files}] skip (exists) {p["newname"]}')
                    continue
                print(f'[{done}/{total_files}] {p["newname"]}  '
                      f'({p["size"] / 1e6:.0f} MB)')
                with zf.open(p['name']) as src, open(dest, 'wb') as out:
                    while chunk := src.read(1024 * 1024):
                        out.write(chunk)

    json.dump({'modules': module_map,
               'lessons': [{'module': p['mod_n'], 'lesson': p['lesson_n'],
                            'title': p['title'], 'file': p['newname']}
                           for p in plan]},
              open(os.path.join(args.out, 'module-map.json'), 'w'), indent=2)

    print(f'\nDone. {total_files} videos in {args.out}')
    print('Drag that folder into YouTube Studio, set all to Unlisted, '
          'and add them to one playlist.')


if __name__ == '__main__':
    main()
