"""Prints everything a card writer needs for a verse range, as plain text.
Usage: python -I -X utf8 tools/verse_context.py SURAH FROM TO [--cap=8000]
Tafsir passages shared by several verses are printed once.
"""
import json, re, sys
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')
ROOT = Path(__file__).resolve().parent.parent
args = [a for a in sys.argv[1:] if not a.startswith('--')]
cap = 8000
for a in sys.argv[1:]:
    if a.startswith('--cap='):
        cap = int(a.split('=')[1])
surah, lo, hi = int(args[0]), int(args[1]), int(args[2])

strip = lambda t: re.sub(r'\s+', ' ', re.sub('<[^>]+>', ' ', t)).strip()
load = lambda n: json.loads((ROOT / n).read_text(encoding='utf-8'))
quran = load('quran.json')
sahih = load('en.sahih.json')
translit = load('en.transliteration.json')
wbw = load('colored-english-wbw-translation.json')
tafsir = load('en-tafisr-ibn-kathir.json')
info = load('surah-info-en.json')

s = quran[surah - 1]
place = 'makkah' if s['type'] == 'meccan' else 'madinah'
print(f"SURAH {surah} | {s['transliteration']} | {s['name']} | place={place} | {s['total_verses']} verses | range {lo}-{hi}\n")
print("SURAH INTRODUCTION (Maududi, trimmed):")
print(strip(info[str(surah)]['text'])[:2500] + "\n")

# a tafsir passage that starts before the range still matters for context
first_key = f"{surah}:{lo}"
seen = set()
for v in s['verses']:
    if not lo <= v['id'] <= hi:
        continue
    key = f"{surah}:{v['id']}"
    t = tafsir[key]
    gid = key if isinstance(t, dict) else t
    words = v['text'].split(' ')
    wb = ' | '.join(f"{w}={strip(wbw.get(f'{key}:{i}', '?'))}" for i, w in enumerate(words, 1))
    print(f"=== {key}")
    print(f"Arabic: {v['text']}")
    print(f"Sahih International: {sahih[key]['text']}")
    print(f"Transliteration: {strip(translit[key]['text'])}")
    print(f"Word by word: {wb}")
    if gid in seen:
        print(f"Tafsir: see passage {gid} above\n")
        continue
    seen.add(gid)
    text = strip(tafsir[gid]['text'])
    more = f" ... [{len(text) - cap} more chars cut]" if len(text) > cap else ""
    print(f"Tafsir Ibn Kathir (passage starting {gid}): {text[:cap]}{more}\n")
