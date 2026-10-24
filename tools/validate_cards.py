"""Validates card JSON files. Usage: python -I -X utf8 tools/validate_cards.py FILE_OR_DIR [...]
Slice files named SSS-FFF-TTT.json must contain exactly verses FFF..TTT of surah SSS, in order
(except verses listed in SKIP, which already exist elsewhere).
Exit code 1 on any error.
"""
import json, re, sys
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')
ROOT = Path(__file__).resolve().parent.parent
quran = json.loads((ROOT / 'quran.json').read_text(encoding='utf-8'))
TOTAL = {s['id']: s['total_verses'] for s in quran}
PLACE = {s['id']: 'makkah' if s['type'] == 'meccan' else 'madinah' for s in quran}
SKIP = {'2:261', '12:25', '94:5'} | {f'111:{i}' for i in range(1, 6)}

KEYS = {'id', 'surah', 'ayah', 'place', 'title', 'subtitle', 'picture', 'key', 'then', 'now', 'old', 'new', 'try', 'related', 'meta'}
BOXES = {'idea', 'trap', 'reward', 'people', 'plain'}
TAG = re.compile(r'\{(/?)(idea|trap|reward)\}')
ID = re.compile(r'^(\d+):(\d+)$')
SLICE = re.compile(r'^(\d{3})-(\d{3})-(\d{3})\.json$')


def check_row(row, where, errs):
    if not isinstance(row, list) or not 1 <= len(row) <= 6:
        errs.append(f'{where}: row must be a list of 1-6 items'); return
    boxes = 0
    for it in row:
        if not isinstance(it, dict):
            errs.append(f'{where}: row item not an object'); continue
        if 'conn' in it:
            if set(it) != {'conn'} or not isinstance(it['conn'], str) or not it['conn'].strip():
                errs.append(f'{where}: bad connector {it}')
            continue
        boxes += 1
        extra = set(it) - {'box', 'title', 'sub', 'strike', 'num'}
        if extra: errs.append(f'{where}: unknown box keys {extra}')
        if it.get('box') not in BOXES: errs.append(f'{where}: box style {it.get("box")!r} not in {sorted(BOXES)}')
        if not isinstance(it.get('title'), str) or not it['title'].strip(): errs.append(f'{where}: box title missing')
        elif len(it['title']) > 60: errs.append(f'{where}: box title over 60 chars')
        if 'sub' in it and (not isinstance(it['sub'], list) or not all(isinstance(x, str) for x in it['sub'])):
            errs.append(f'{where}: sub must be a list of strings')
        for b in ('strike', 'num'):
            if b in it and not isinstance(it[b], bool): errs.append(f'{where}: {b} must be boolean')
    if boxes == 0: errs.append(f'{where}: row has no boxes')


def check_rich(s, where, errs):
    if not isinstance(s, str) or len(s) < 60:
        errs.append(f'{where}: too short or missing'); return
    if '<' in s or '>' in s: errs.append(f'{where}: contains HTML')
    depth = 0
    for m in TAG.finditer(s):
        depth += -1 if m.group(1) else 1
        if depth not in (0, 1): errs.append(f'{where}: nested or unopened tag'); return
    if depth: errs.append(f'{where}: unclosed tag')
    if re.sub(TAG, '', s).count('{') or re.sub(TAG, '', s).count('}'): errs.append(f'{where}: stray brace or unknown tag')


def check_card(c, errs):
    cid = c.get('id', '?') if isinstance(c, dict) else '?'
    if not isinstance(c, dict): errs.append('card is not an object'); return
    if set(c) != KEYS: errs.append(f'{cid}: keys differ, missing {KEYS - set(c)}, extra {set(c) - KEYS}'); return
    m = ID.match(c['id'])
    if not m or int(m.group(1)) != c['surah'] or int(m.group(2)) != c['ayah']: errs.append(f'{cid}: id/surah/ayah mismatch')
    elif not 1 <= c['ayah'] <= TOTAL.get(c['surah'], 0): errs.append(f'{cid}: ayah out of range')
    elif c['place'] != PLACE[c['surah']]: errs.append(f'{cid}: place should be {PLACE[c["surah"]]}')
    t = c['title']
    if not isinstance(t, str) or not t.strip(): errs.append(f'{cid}: title missing')
    else:
        if len(t.split()) > 12: errs.append(f'{cid}: title over 12 words')
        if '"' in t: errs.append(f'{cid}: title contains double quotes')
    if not isinstance(c['subtitle'], str) or not c['subtitle'].strip() or len(c['subtitle']) > 90: errs.append(f'{cid}: subtitle missing or over 90 chars')
    p = c['picture']
    if not isinstance(p, dict) or p.get('kind') not in ('boxes', 'svg'): errs.append(f'{cid}: picture.kind must be boxes or svg')
    elif p['kind'] == 'boxes':
        if set(p) != {'kind', 'label', 'row'} or not isinstance(p['label'], str) or not p['label'].strip(): errs.append(f'{cid}: picture needs kind, label, row')
        else: check_row(p['row'], f'{cid} picture', errs)
    k = c['key']
    if not isinstance(k, dict) or set(k) != {'label', 'row'} or not isinstance(k['label'], str) or not k['label'].strip(): errs.append(f'{cid}: key needs label, row')
    else: check_row(k['row'], f'{cid} key', errs)
    check_rich(c['then'], f'{cid} then', errs)
    check_rich(c['now'], f'{cid} now', errs)
    for f, n in (('old', 120), ('new', 120), ('try', 160)):
        v = c[f]
        if not isinstance(v, str) or len(v) < 8 or len(v) > n: errs.append(f'{cid}: {f} missing or over {n} chars')
        elif '{' in v or '<' in v: errs.append(f'{cid}: {f} must be plain text')
    if not isinstance(c['related'], list) or len(c['related']) > 4 or not all(isinstance(r, str) and ID.match(r) for r in c['related']):
        errs.append(f'{cid}: related must be up to 4 ids like "2:255"')
    mt = c['meta']
    if not isinstance(mt, dict) or not isinstance(mt.get('version'), int) or mt.get('status') not in ('draft', 'review', 'approved'):
        errs.append(f'{cid}: meta needs version int and status')


def check_file(path):
    errs = []
    try:
        cards = json.loads(path.read_text(encoding='utf-8'))
    except Exception as e:
        return [f'invalid JSON: {e}']
    if not isinstance(cards, list): return ['top level must be an array']
    for c in cards: check_card(c, errs)
    m = SLICE.match(path.name)
    if m and not errs:
        s, f, t = map(int, m.groups())
        want = [f'{s}:{a}' for a in range(f, t + 1) if f'{s}:{a}' not in SKIP]
        got = [c['id'] for c in cards]
        if got != want:
            missing = [x for x in want if x not in got]
            extra = [x for x in got if x not in want]
            errs.append(f'ids do not match range {s}:{f}-{t}. missing {missing[:10]} extra {extra[:10]}' + (' (order wrong)' if not missing and not extra else ''))
    return errs



if __name__ == '__main__':
    files = []
    for a in sys.argv[1:]:
        p = Path(a)
        files += sorted(p.glob('*.json')) if p.is_dir() else [p]
    bad = 0
    for f in files:
        e = check_file(f)
        if e:
            bad += 1
            print(f'FAIL {f.name}')
            for x in e[:25]: print('  ' + x)
        else:
            print(f'ok   {f.name}')
    sys.exit(1 if bad else 0)
