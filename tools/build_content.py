"""Writes the card content as JSON: content/theme.json, content/schema.json, content/cards/NNN.json.
Source of truth for both apps. Run: python -I -X utf8 tools/build_content.py
"""
import json, re, sys
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')
ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'content'
(OUT / 'cards').mkdir(parents=True, exist_ok=True)

# ---------------------------------------------------------------- theme
THEME = {
    "palettes": {
        "royal": {"bg": "#f7f7f3", "page": "#ffffff", "fg": "#15171f", "muted": "#646b78", "line": "#e6e8ee", "soft": "#f4f5f9",
                  "idea": "#4f52d9", "trap": "#d6453a", "reward": "#b7791f", "good": "#0ea5e9", "people": "#6b7280",
                  "ideaBg": "#eef0fb", "trapBg": "#fdeeec", "rewardBg": "#fbf3e3", "peopleBg": "#f1f2f4", "rewardSoft": "#f3e4c4",
                  "old": "#7a4f32", "new": "#a21caf"},
        "plum": {"bg": "#f8f6fa", "page": "#ffffff", "fg": "#15171f", "muted": "#646b78", "line": "#e6e8ee", "soft": "#f4f5f9",
                 "idea": "#6d28d9", "trap": "#dc2626", "reward": "#c2410c", "good": "#ec4899", "people": "#6b7280",
                 "ideaBg": "#f1eafc", "trapBg": "#fdecec", "rewardBg": "#fdefe4", "peopleBg": "#f1f2f4", "rewardSoft": "#f6dcc8",
                 "old": "#7a4f32", "new": "#1d4ed8"},
        "navy": {"bg": "#f7f5f0", "page": "#ffffff", "fg": "#15171f", "muted": "#646b78", "line": "#e6e8ee", "soft": "#f4f5f9",
                 "idea": "#1e3a8a", "trap": "#b91c1c", "reward": "#a16207", "good": "#2563eb", "people": "#6b7280",
                 "ideaBg": "#e9edf8", "trapBg": "#fbeaea", "rewardBg": "#faf2dc", "peopleBg": "#f1f2f4", "rewardSoft": "#f0e2b8",
                 "old": "#7a4f32", "new": "#a21caf"}
    },
    "default": "royal",
    "fonts": {"ui": "Inter", "display": "Newsreader", "mono": "JetBrains Mono"},
    "roles": {"idea": "the mechanism the verse teaches", "trap": "the wrong view or threat", "reward": "what is gained",
              "good": "good outcome (drawn pictures only)", "people": "the reader and other people",
              "old": "how I saw it (struck line)", "new": "how the verse shows it (bold line)"}
}

# ---------------------------------------------------------------- schema
SCHEMA = {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "title": "Verse card",
    "type": "object",
    "required": ["id", "surah", "ayah", "place", "title", "subtitle", "picture", "key", "then", "now", "old", "new", "try", "meta"],
    "additionalProperties": False,
    "properties": {
        "id": {"type": "string", "pattern": "^[0-9]+:[0-9]+$"},
        "surah": {"type": "integer", "minimum": 1, "maximum": 114},
        "ayah": {"type": "integer", "minimum": 1},
        "place": {"enum": ["makkah", "madinah"]},
        "title": {"type": "string", "maxLength": 90, "description": "One sentence, 12 words max, no quotes"},
        "subtitle": {"type": "string", "maxLength": 90},
        "picture": {"oneOf": [
            {"type": "object", "required": ["kind", "src"], "additionalProperties": False,
             "properties": {"kind": {"const": "svg"}, "src": {"type": "string", "description": "SVG with {{token}} colors from theme"}}},
            {"type": "object", "required": ["kind", "label", "row"], "additionalProperties": False,
             "properties": {"kind": {"const": "boxes"}, "label": {"type": "string"}, "row": {"$ref": "#/definitions/row"}}}
        ]},
        "key": {"type": "object", "required": ["label", "row"], "additionalProperties": False,
                "properties": {"label": {"type": "string"}, "row": {"$ref": "#/definitions/row"}}},
        "then": {"$ref": "#/definitions/rich"},
        "now": {"$ref": "#/definitions/rich"},
        "old": {"type": "string", "maxLength": 120},
        "new": {"type": "string", "maxLength": 120},
        "try": {"type": "string", "maxLength": 160},
        "related": {"type": "array", "items": {"type": "string", "pattern": "^[0-9]+:[0-9]+$"}},
        "meta": {"type": "object", "required": ["version", "status"], "additionalProperties": False,
                 "properties": {"version": {"type": "integer"}, "status": {"enum": ["draft", "review", "approved"]},
                                "reviewer": {"type": ["string", "null"]}, "updated": {"type": "string"}}}
    },
    "definitions": {
        "rich": {"type": "string", "description": "Plain text with {idea}..{/idea}, {trap}..{/trap}, {reward}..{/reward} only"},
        "row": {"type": "array", "minItems": 1, "items": {"oneOf": [
            {"type": "object", "required": ["box", "title"], "additionalProperties": False,
             "properties": {"box": {"enum": ["idea", "trap", "reward", "people", "plain"]}, "title": {"type": "string"},
                            "sub": {"type": "array", "items": {"type": "string"}}, "strike": {"type": "boolean"},
                            "num": {"type": "boolean"}}},
            {"type": "object", "required": ["conn"], "additionalProperties": False, "properties": {"conn": {"type": "string"}}}
        ]}}
    }
}

# ---------------------------------------------------------------- pictures drawn as svg (from verse-cards.html)
cards_html = (ROOT / 'verse-cards.html').read_text(encoding='utf-8')
svgs = re.findall(r'<div class="fig">\s*(<svg.*?</svg>)\s*</div>', cards_html, re.S)
assert len(svgs) == 3
TOKEN_MAP = [('color-mix(in srgb,var(--gold) 18%,transparent)', '{{rewardSoft}}'),
             ('var(--idea)', '{{idea}}'), ('var(--warn)', '{{trap}}'), ('var(--gold)', '{{reward}}'), ('var(--good)', '{{good}}'),
             ('var(--you)', '{{people}}'), ('var(--muted)', '{{muted}}'), ('var(--line)', '{{line}}'), ('var(--fg)', '{{fg}}'),
             ('var(--card)', '{{page}}')]


def tokenize(svg):
    for a, b in TOKEN_MAP:
        svg = svg.replace(a, b)
    svg = re.sub(r'\s+', ' ', svg).strip()
    assert 'var(--' not in svg, svg
    return svg


SVG = {'94:5': tokenize(svgs[0]), '12:25': tokenize(svgs[1]), '2:261': tokenize(svgs[2])}


# ---------------------------------------------------------------- helpers
def box(style, title, *sub, strike=False, num=False):
    d = {"box": style, "title": title}
    if sub: d["sub"] = list(sub)
    if strike: d["strike"] = True
    if num: d["num"] = True
    return d


def conn(t):
    return {"conn": t}


def card(id, place, title, subtitle, picture, key_label, key_row, then, now, old, new, try_, related=()):
    s, a = id.split(':')
    return {"id": id, "surah": int(s), "ayah": int(a), "place": place, "title": title, "subtitle": subtitle,
            "picture": picture, "key": {"label": key_label, "row": key_row},
            "then": then, "now": now, "old": old, "new": new, "try": try_, "related": list(related),
            "meta": {"version": 1, "status": "draft", "reviewer": None, "updated": "2026-10-19"}}


def svgpic(id):
    return {"kind": "svg", "src": SVG[id]}


def boxpic(label, row):
    return {"kind": "boxes", "label": label, "row": row}


# ---------------------------------------------------------------- the cards
CARDS = [
    card('94:5', 'makkah', 'Ease is not after hardship. It is inside it.', 'Where relief actually lives',
         svgpic('94:5'), 'The one word that changes it',
         [box('people', 'after', 'hardship, then one day, ease', strike=True), conn('the verse says'),
          box('idea', 'with', "ma'a: one hardship, two eases, same season")],
         'Makkah. Rejection, mockery, few followers. Allah did not say "it will end." He said: {idea}look inside it, ease is already there, and it is there twice.{/idea}',
         'Months of job hunting. A sick parent. You keep saying {trap}"when this is over."{/trap} The verse says: do not wait for over. {idea}Find the ease that is here already.{/idea}',
         'Hardship, then relief. Two seasons.', 'One season, both at once. Find the second one.',
         'Name one ease you have right now, inside your current difficulty. Write it down.', ['94:6', '2:286', '65:7']),

    card('12:25', 'makkah', 'He ran. She grabbed. She spoke first.', 'Doing right leaves evidence, even while the lie is being told',
         svgpic('12:25'), 'Two versions, one shirt',
         [box('trap', 'her story', '"he wanted evil with your wife"', 'spoken first'),
          box('reward', 'torn from the back', '= he was leaving, not coming', 'the evidence')],
         "A slave in a minister's house in Egypt. Doors locked, the wife pressing him. He chose the door and got caught at it anyway. {trap}She spoke first, as the victim.{/trap}",
         'You did the right thing and it still blew up. The person who pushed you now tells the manager, the family, the group chat, that {trap}you were the problem.{/trap} {idea}Truth was on him while the lie was being told.{/idea}',
         'Doing right protects me from being accused.', 'Doing right leaves evidence. The shirt was torn from the back.',
         'Caught in a false version of events? State what happened once, plainly. Then let the torn shirt speak.', ['12:26', '12:28']),

    card('2:261', 'madinah', 'You give one. Allah grows it to seven hundred.', 'How spending for Allah is counted',
         svgpic('2:261'), 'Two ways to count it',
         [box('trap', 'minus 50', 'subtraction from my account'), conn('the verse says'),
          box('reward', 'times 700', 'planted, not spent, and more for whom He wills')],
         'New community in Madinah, poor, building a mosque, feeding migrants. Giving felt like losing. {idea}Allah showed them farming instead of subtracting.{/idea}',
         'Salary just hit. Rent, bills, a bit left. The donation link is open. Your brain says {trap}"minus 50."{/trap} The verse says {reward}"times 700."{/reward}',
         'Giving is subtraction from my account.', 'Giving is planting. The seed leaves my hand so it can grow.',
         'Give one small amount today. Picture seven ears.', ['2:262', '2:265', '6:160']),

    card('111:1', 'makkah', 'His uncle cursed him. Allah returned the curse, forever.', 'The only enemy named in the Quran, and what he said',
         boxpic('What he said, on the hill',
                [box('people', 'Abu Lahab', 'his own uncle'), conn('stands up, says'), box('trap', '"may you perish"', 'dusting off his hands')]),
         'What Allah said back',
         [box('reward', '"perish his hands, and perish he"', 'the same word, returned'), conn('recited'), box('idea', 'forever', 'in every mushaf, every prayer')],
         'The Prophet ﷺ climbed a hill, called all of Makkah, and warned them. His own uncle stood up, dusted off his hands: {trap}"Is this why you gathered us? May you perish."{/trap} The one man whose job was to protect him.',
         'The relative who mocks your choices at every gathering. The one who should have your back and {trap}laughs the loudest instead.{/trap} You keep hoping blood will fix it. {idea}Allah defended His Prophet when his uncle would not.{/idea}',
         'Family will come around if I keep proving myself.', 'Some will not. Your worth does not wait on their approval.',
         'Stop rehearsing the argument with that relative. Do your work. Let the record be written elsewhere.', ['111:2', '26:214']),

    card('111:2', 'makkah', 'Money and sons bought him nothing.', 'What he planned to pay with on the Day',
         boxpic('His plan',
                [box('reward', 'wealth', '"I will pay"'), box('reward', 'sons', '"they will ransom me"'), conn('offered at'), box('idea', 'the Day', 'the gate')]),
         'What it bought',
         [box('trap', '0', 'nothing he owned crosses', num=True), box('idea', 'what he did', 'the only thing that crosses')],
         'Abu Lahab was rich, connected, with grown sons. Warned about the Day, he said: {trap}if it is true, I will ransom myself with my wealth and my children.{/trap} This verse is the reply.',
         'The savings account. The pension. The kids who will "take care of me." The network. Everything you quietly count on when the thought of death passes through. {idea}Blessings for here, not currency for there.{/idea}',
         'What I own and who I raised are my safety net.', 'Nothing I own crosses with me except what I did with it.',
         'Name one thing you are secretly relying on instead of Allah. Say it out loud.', ['111:3', '26:88', '3:10']),

    card('111:3', 'makkah', 'Father of Flame. Allah told him where the flame ends.', 'A proud nickname, turned over',
         boxpic('One word, two places',
                [box('reward', 'Abu Lahab', '"father of flame"', 'a glowing face, a proud name'), conn('same word'), box('trap', 'a fire of lahab', 'where the flame ends')]),
         'What a name is made of',
         [box('people', 'what people call me', 'lighting', strike=True), box('idea', 'what my deeds are called', 'on that Day')],
         'His real name was Abdul-Uzza. People called him Abu Lahab because his face shone, and {reward}he loved the name.{/reward} The verse turns it over: {trap}the flame will not be on his face. He will be inside it.{/trap}',
         "The reputation you polish. The title, the nickname, the way people describe you at parties. Built on what? {trap}If it is built on someone else's back, it has an ending.{/trap}",
         'A good name is what people call me.', 'A good name is what my deeds will be called on that Day. The rest is lighting.',
         'Ask what one person you have wronged would call you. Fix that before polishing anything else.', ['111:4', '49:11']),

    card('111:4', 'makkah', 'She carried the wood that fed his fire.', 'Feeding a fire is its own deed',
         boxpic('Who kept it burning',
                [box('people', 'Umm Jamil', 'sister of Abu Sufyan', 'a leading woman of Quraysh'), conn('carries'),
                 box('trap', 'the wood', 'thorns on his path, stories, fuel'), conn('into'), box('trap', 'his fire', "her husband's hate")]),
         'What counts as a deed',
         [box('people', '"I only reacted"', 'he started it', strike=True), box('trap', 'carrying the wood', 'counts the same as lighting it')],
         "Umm Jamil, sister of Abu Sufyan, one of the leading women of Quraysh. She scattered thorns on the path the Prophet ﷺ walked at night. {trap}She was not dragged into her husband's hatred. She fed it.{/trap}",
         'The friend who, every time you are angry, adds a story. The spouse who never says "let it go." The group chat that keeps a grudge alive for years. {idea}Wood carriers.{/idea}',
         'I am only reacting to what others started.', 'Feeding a fire is its own deed. Carrying the wood counts the same as lighting it.',
         'Think of one grudge you keep warm for someone else. Put the wood down.', ['111:5', '49:12', '104:1']),

    card('111:5', 'makkah', 'The rope she carried harm with, now on her neck.', 'What you carry for others, you wear',
         boxpic('One rope',
                [box('people', 'a carrying rope', "palm fiber, a worker's tool"), conn('used to carry'),
                 box('trap', 'the thorns', 'harm for his path'), conn('becomes'), box('trap', 'a collar', 'twisted, on her neck')]),
         'What I carry',
         [box('people', 'my weapons are separate from me', 'pick up, put down', strike=True), box('idea', 'what I carry for others, I wear', 'the rope goes both ways')],
         "A rope of palm fiber was a worker's tool: bind the bundle, carry it on your back. She used hers to carry harm. The surah ends with {trap}the same rope, twisted, on her neck.{/trap} The tool became the sentence.",
         "The sharp tongue that wins every argument. The talent for finding people's weak spots. The screenshot folder. {idea}Whatever you use to hurt, you are also tying to yourself.{/idea}",
         'My weapons are separate from me. I pick them up, I put them down.', 'What I carry for others, I wear.',
         'Delete one thing you kept as a weapon.', ['111:4', '17:13']),
]

# ---------------------------------------------------------------- checks + write
TAG = re.compile(r'\{(/?)(idea|trap|reward)\}')


def check(c):
    assert len(c['title'].split()) <= 12, f"{c['id']} title too long"
    for f in ('then', 'now'):
        depth = 0
        for m in TAG.finditer(c[f]):
            depth += -1 if m.group(1) else 1
            assert depth in (0, 1), f"{c['id']} nested tag in {f}"
        assert depth == 0, f"{c['id']} unbalanced tag in {f}"
        assert '<' not in c[f], f"{c['id']} html in {f}"


by_surah = {}
for c in CARDS:
    check(c)
    by_surah.setdefault(c['surah'], []).append(c)

(OUT / 'theme.json').write_text(json.dumps(THEME, ensure_ascii=False, indent=2), encoding='utf-8')
(OUT / 'schema.json').write_text(json.dumps(SCHEMA, ensure_ascii=False, indent=2), encoding='utf-8')
# hand-written seed cards live with the generated parts; tools/merge_cards.py builds the per-surah files
(OUT / 'cards' / 'parts').mkdir(parents=True, exist_ok=True)
(OUT / 'cards' / 'parts' / 'seed.json').write_text(json.dumps(CARDS, ensure_ascii=False, indent=2), encoding='utf-8')
print(f'content/cards/parts/seed.json  {len(CARDS)} cards')
print('content/theme.json, content/schema.json')
