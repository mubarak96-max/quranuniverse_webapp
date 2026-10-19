"""Merges content/cards/parts/*.json into one file per surah: content/cards/NNN.json, sorted by ayah.
Fails on duplicate ids. Run after validate_cards.py passes on the parts.
"""
import json, sys
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')
ROOT = Path(__file__).resolve().parent.parent
PARTS = ROOT / 'content' / 'cards' / 'parts'
OUT = ROOT / 'content' / 'cards'

by_id = {}
for f in sorted(PARTS.glob('*.json')):
    for c in json.loads(f.read_text(encoding='utf-8')):
        if c['id'] in by_id:
            sys.exit(f'duplicate {c["id"]} in {f.name} and {by_id[c["id"]][0]}')
        by_id[c['id']] = (f.name, c)

by_surah = {}
for _, c in by_id.values():
    by_surah.setdefault(c['surah'], []).append(c)
for s, cards in sorted(by_surah.items()):
    cards.sort(key=lambda c: c['ayah'])
    (OUT / f'{s:03d}.json').write_text(json.dumps(cards, ensure_ascii=False, indent=2), encoding='utf-8')
print(f'{len(by_id)} cards in {len(by_surah)} surah files')
