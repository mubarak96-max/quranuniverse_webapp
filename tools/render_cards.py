"""Renders content/cards/*.json into one HTML page (the web renderer, also the round-trip proof).
Run: python -I -X utf8 tools/render_cards.py  ->  cards-from-data.html
"""
import json, re, sys, html
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')
ROOT = Path(__file__).resolve().parent.parent
CONTENT = ROOT / 'content'
theme = json.loads((CONTENT / 'theme.json').read_text(encoding='utf-8'))
cards = []
for f in sorted((CONTENT / 'cards').glob('*.json')):
    cards += json.loads(f.read_text(encoding='utf-8'))

SURAH = {s['id']: s['transliteration'] for s in json.loads((ROOT / 'quran.json').read_text(encoding='utf-8'))}
TAG = re.compile(r'\{(idea|trap|reward)\}(.*?)\{/\1\}', re.S)
BOX_CLASS = {'idea': 'idea', 'trap': 'warn', 'reward': 'gold', 'people': 'you', 'plain': ''}


def css_vars(p):
    return ';'.join(f'--{k}:{v}' for k, v in p.items())


def rich(s):
    out, pos = [], 0
    for m in TAG.finditer(s):
        out.append(html.escape(s[pos:m.start()]))
        out.append(f'<i class="{m.group(1)}">{html.escape(m.group(2))}</i>')
        pos = m.end()
    out.append(html.escape(s[pos:]))
    return ''.join(out)


def row(items):
    h = []
    for it in items:
        if 'conn' in it:
            h.append(f'<div class="conn"><i>{html.escape(it["conn"])}</i></div>')
        else:
            cls = ' '.join(x for x in [BOX_CLASS[it['box']], 'strike' if it.get('strike') else '', 'num' if it.get('num') else ''] if x)
            subs = ''.join(f'<span>{html.escape(x)}</span>' for x in it.get('sub', []))
            h.append(f'<div class="box {cls}"><b>{html.escape(it["title"])}</b>{subs}</div>')
    return '<div class="row">' + ''.join(h) + '</div>'


def picture(p):
    if p['kind'] == 'svg':
        # palette tokens resolve through CSS variables on the web; mobile substitutes hex here instead
        src = re.sub(r'\{\{(\w+)\}\}', r'var(--\1)', p['src'])
        return f'<div class="fig">{src}</div>'
    return f'<div class="dia"><div class="lab">{html.escape(p["label"])}</div>{row(p["row"])}</div>'


def page(c):
    return f'''
<section class="page">
  <div class="top"><span class="eyebrow">{SURAH[c["surah"]]} · {c["id"]}</span><span class="pill">{c["place"].capitalize()}</span></div>
  <h2>{html.escape(c["title"])}</h2>
  <p class="sub">{html.escape(c["subtitle"])}</p>
  <hr>
  {picture(c["picture"])}
  <div class="dia"><div class="lab">{html.escape(c["key"]["label"])}</div>{row(c["key"]["row"])}</div>
  <div class="text">
    <p class="story">{rich(c["then"])}</p>
    <p class="story">{rich(c["now"])}</p>
    <div class="shift"><p><span>{html.escape(c["old"])}</span></p><p><span>{html.escape(c["new"])}</span></p></div>
  </div>
  <div class="today"><div class="lab">Try this</div><p>{html.escape(c["try"])}</p></div>
  <div class="foot"><span>simplified · read the tafsir</span><span>{c["meta"]["status"]} · v{c["meta"]["version"]}</span></div>
</section>'''


palettes = theme['palettes']
default = palettes[theme['default']]
pal_css = '\n'.join(f':root[data-palette="{k}"]{{{css_vars(v)}}}' for k, v in palettes.items())
buttons = ''.join(f'<button onclick="document.documentElement.dataset.palette=\'{k}\'">{k.capitalize()}</button>' for k in palettes)

CSS = f'''
:root{{{css_vars(default)};--body:"Inter","Segoe UI",system-ui,sans-serif;--display:"Newsreader",Georgia,serif;--mono:"JetBrains Mono",Consolas,monospace;
  --warn:var(--trap);--gold:var(--reward);--you:var(--people);--card:var(--page);--warn-bg:var(--trapBg);--gold-bg:var(--rewardBg);--you-bg:var(--peopleBg);--idea-bg:var(--ideaBg)}}
{pal_css}
body{{margin:0;background:var(--bg);color:var(--fg);font-family:var(--body);padding:clamp(16px,4vw,40px) max(16px,env(safe-area-inset-left,0px)) 60px max(16px,env(safe-area-inset-right,0px))}}
.wrap{{max-width:640px;margin:0 auto;display:flex;flex-direction:column;gap:40px}}
.pal{{display:flex;gap:8px;flex-wrap:wrap}}
.pal button{{font:600 13px var(--body);padding:7px 12px;border:1px solid var(--line);background:var(--page);color:var(--fg);border-radius:8px;cursor:pointer}}
.page{{background:var(--page);border-radius:18px;padding:clamp(20px,4vw,36px) clamp(18px,4vw,36px) clamp(20px,4vw,30px);box-shadow:0 10px 36px rgba(20,24,40,.06);position:relative;display:flex;flex-direction:column;gap:18px;min-width:0}}
.page::before{{content:"";position:absolute;top:0;left:clamp(18px,4vw,36px);width:40px;height:4px;border-radius:0 0 3px 3px;background:var(--idea)}}
.top{{display:flex;justify-content:space-between;align-items:center;gap:12px}}
.eyebrow{{font-size:13px;font-weight:600;color:var(--idea)}}
.pill{{font-size:12px;font-weight:500;color:var(--muted);background:var(--soft);border-radius:999px;padding:5px 11px}}
h2{{font-size:clamp(26px,6vw,36px);font-weight:800;letter-spacing:-.02em;line-height:1.1;margin:0;text-wrap:balance}}
.sub{{font-size:17px;color:var(--muted);margin:-8px 0 0}}
hr{{border:0;border-top:1px solid var(--line);margin:0}}
.fig{{background:var(--ideaBg);border-radius:14px;padding:22px 16px 18px;display:flex;justify-content:center}}
.fig svg{{width:100%;max-width:430px;height:auto;display:block;font-family:var(--body)}}
.dia{{display:flex;flex-direction:column;gap:12px;padding:6px 0}}
.lab{{font-size:10.5px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}}
.row{{display:flex;align-items:stretch;gap:10px;flex-wrap:wrap}}
.box{{flex:1 1 0;min-width:0;border:1px solid var(--line);border-radius:10px;padding:12px;background:var(--page);text-align:center;display:flex;flex-direction:column;gap:3px;justify-content:center}}
.box b{{font-size:15px;font-weight:700;color:var(--fg)}}
.box span{{font-size:12px;color:var(--muted)}}
.box.idea{{background:var(--ideaBg);border-color:transparent}}.box.idea b{{color:var(--idea)}}
.box.warn{{background:var(--trapBg);border-color:transparent}}.box.warn b{{color:var(--trap)}}
.box.gold{{background:var(--rewardBg);border-color:transparent}}.box.gold b{{color:var(--reward)}}
.box.you{{background:var(--peopleBg);border-color:transparent}}.box.you b{{color:var(--people)}}
.box.num b{{font-size:26px;font-weight:800;font-variant-numeric:tabular-nums}}
.strike b{{text-decoration:line-through;text-decoration-color:var(--trap);text-decoration-thickness:2px;color:var(--muted)}}
.conn{{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;min-width:60px;flex:0 0 auto}}
.conn i{{font-size:11px;color:var(--muted);font-style:normal;white-space:nowrap}}
.conn::after{{content:"";width:44px;height:0;border-top:1.5px dashed var(--muted);opacity:.6}}
.text{{border:1px solid var(--line);border-radius:14px;padding:18px 20px;display:flex;flex-direction:column;gap:12px;font-size:15.5px;line-height:1.55}}
.text p{{margin:0}}
.text p.story::first-letter{{font-family:var(--display);font-size:2.7em;line-height:.8;float:left;padding:5px 7px 0 0;color:var(--idea);font-weight:600}}
i.idea{{font-style:normal;color:var(--idea);font-weight:500}}
i.trap{{font-style:normal;color:var(--trap);font-weight:500}}
i.reward{{font-style:normal;color:var(--reward);font-weight:500}}
.shift{{display:flex;flex-direction:column;gap:10px;margin-top:2px}}
.shift p{{padding-left:14px;border-left:2px solid var(--line);display:flex;flex-direction:column;gap:2px}}
.shift p:first-child{{border-left-color:color-mix(in srgb,var(--old) 35%,transparent)}}
.shift p:first-child span{{color:var(--old);text-decoration:line-through;text-decoration-thickness:1px;text-decoration-color:color-mix(in srgb,var(--old) 55%,transparent)}}
.shift p:last-child{{border-left-color:var(--new)}}
.shift p:last-child span{{font-weight:600;color:var(--new)}}
.today{{background:var(--ideaBg);border-radius:12px;padding:14px 18px;display:flex;flex-direction:column;gap:4px}}
.today .lab{{color:var(--idea)}}
.today p{{margin:0;font-family:var(--display);font-size:21px;line-height:1.3;font-weight:600;color:var(--idea)}}
.foot{{display:flex;justify-content:space-between;font-size:11.5px;color:var(--muted)}}
@media (max-width:520px){{.conn{{min-width:0;width:100%;flex-direction:row;gap:8px}}.conn::after{{width:28px}}.row{{gap:8px}}}}
'''

HTML = f'''<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Cards From Data</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Newsreader:ital,opsz,wght@0,6..72,500;0,6..72,600;1,6..72,500&family=JetBrains+Mono:wght@500&display=swap">
<style>{CSS}</style></head><body>
<div class="wrap">
<div class="pal">{buttons}</div>
{''.join(page(c) for c in cards)}
</div>
</body></html>
'''
out = ROOT / 'cards-from-data.html'
out.write_text(HTML, encoding='utf-8')
print(f'{out.name}: {len(cards)} cards')
