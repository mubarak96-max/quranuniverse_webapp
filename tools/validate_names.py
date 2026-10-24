"""Validates name page JSON files. Usage: python -I -X utf8 tools/validate_names.py FILE_OR_DIR [...]
Each file is content/names/<slug>.json, where <slug> is a name in content/names.json.
Exit code 1 on any error.
"""
import json, re, sys
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / 'tools'))
from validate_cards import check_row, check_rich  # noqa: E402

SLUGS = {n['slug'] for n in json.loads((ROOT / 'content' / 'names.json').read_text(encoding='utf-8'))}
KEYS = {'slug', 'title', 'subtitle', 'intro', 'root', 'picture', 'key', 'knowing', 'seeing', 'trusting', 'loving',
        'now', 'old', 'new', 'try', 'dua', 'pairs', 'faq', 'lessons', 'meta'}
PROSE = ('knowing', 'seeing', 'trusting', 'loving')


def plain(s, where, errs, lo, hi):
    if not isinstance(s, str) or not lo <= len(s) <= hi: errs.append(f'{where}: must be {lo}-{hi} chars')
    elif re.search(r'[{}<>]', s): errs.append(f'{where}: no tags or HTML here')


def check_name(slug, c, errs):
    if not isinstance(c, dict): errs.append(f'{slug}: not an object'); return
    if set(c) != KEYS: errs.append(f'{slug}: keys differ, missing {KEYS - set(c)}, extra {set(c) - KEYS}'); return
    if c['slug'] != slug or slug not in SLUGS: errs.append(f'{slug}: slug must match file name and content/names.json')
    t = c['title']
    if not isinstance(t, str) or not t.strip() or len(t.split()) > 12 or '"' in t: errs.append(f'{slug}: title missing, over 12 words, or quoted')
    plain(c['subtitle'], f'{slug} subtitle', errs, 10, 90)
    plain(c['intro'], f'{slug} intro', errs, 120, 420)
    r = c['root']
    if not isinstance(r, dict) or set(r) != {'letters', 'sense'} or not isinstance(r['letters'], str) or not r['letters'].strip():
        errs.append(f'{slug}: root needs letters, sense')
    else: plain(r['sense'], f'{slug} root.sense', errs, 40, 400)
    for k in ('picture', 'key'):
        p = c[k]
        want = {'kind', 'label', 'row'} if k == 'picture' else {'label', 'row'}
        if not isinstance(p, dict) or set(p) != want or (k == 'picture' and p['kind'] != 'boxes') or not str(p.get('label', '')).strip():
            errs.append(f'{slug}: {k} needs {sorted(want)}')
        else: check_row(p['row'], f'{slug} {k}', errs)
    for k in PROSE:
        v = c[k]
        if not isinstance(v, list) or not 1 <= len(v) <= 4: errs.append(f'{slug}: {k} must be 1-4 paragraphs'); continue
        for i, para in enumerate(v): check_rich(para, f'{slug} {k}[{i}]', errs)
    check_rich(c['now'], f'{slug} now', errs)
    for k in ('old', 'new', 'try'): plain(c[k], f'{slug} {k}', errs, 15, 240)
    d = c['dua']
    if not isinstance(d, dict) or set(d) != {'text', 'note'}: errs.append(f'{slug}: dua needs text, note')
    else:
        plain(d['text'], f'{slug} dua.text', errs, 20, 320)
        plain(d['note'], f'{slug} dua.note', errs, 20, 320)
    if not isinstance(c['pairs'], list) or len(c['pairs']) > 3: errs.append(f'{slug}: pairs must be a list of 0-3')
    else:
        for p in c['pairs']:
            if not isinstance(p, dict) or set(p) != {'slug', 'why'} or p['slug'] not in SLUGS or p['slug'] == slug:
                errs.append(f'{slug}: bad pair {p}')
            else: plain(p['why'], f'{slug} pair {p["slug"]}', errs, 15, 200)
    if not isinstance(c['faq'], list) or not 2 <= len(c['faq']) <= 4: errs.append(f'{slug}: faq must have 2-4 items')
    else:
        for i, f in enumerate(c['faq']):
            if not isinstance(f, dict) or set(f) != {'q', 'a'}: errs.append(f'{slug}: faq[{i}] needs q, a'); continue
            plain(f['q'], f'{slug} faq[{i}].q', errs, 10, 120)
            plain(f['a'], f'{slug} faq[{i}].a', errs, 60, 600)
    ls = c['lessons']
    if not isinstance(ls, list) or not all(isinstance(x, int) and 1 <= x <= 31 for x in ls): errs.append(f'{slug}: lessons must be ints 1-31')
    m = c['meta']
    if not isinstance(m, dict) or set(m) != {'version', 'status', 'reviewer', 'updated'}: errs.append(f'{slug}: bad meta')


def main(args):
    files = []
    for a in args:
        p = Path(a)
        files += sorted(p.glob('*.json')) if p.is_dir() else [p]
    errs = []
    for f in files:
        try: data = json.loads(f.read_text(encoding='utf-8'))
        except json.JSONDecodeError as e: errs.append(f'{f.name}: invalid JSON: {e}'); continue
        check_name(f.stem, data, errs)
    for e in errs: print(e)
    print('ok' if not errs else f'{len(errs)} errors')
    return 1 if errs else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
