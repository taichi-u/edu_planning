"""Deterministic bilingual meeting figure. Only reads fixture.json.

Run with reportlab and fonttools. FontTools is used to decode the already
installed OFL WOFF; the embedded font is not renamed or modified.
"""
import json
import os
from datetime import date, timedelta
from pathlib import Path

from fontTools.ttLib import TTFont as SourceFont
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.colors import HexColor, Color

ROOT = Path(__file__).resolve().parent
DATA = json.loads((ROOT / 'fixture.json').read_text())
OUT = ROOT.parent / 'output' / 'pdf' / 'research-plan-comparison.pdf'
TMP = Path(os.environ.get('TMPDIR', '/private/tmp')) / 'edu-design-fonts'
TMP.mkdir(exist_ok=True)
for weight, name in [(400, 'Plex'), (500, 'PlexMedium')]:
    source = ROOT.parent / 'node_modules' / '@fontsource' / 'ibm-plex-sans-jp' / 'files' / f'ibm-plex-sans-jp-japanese-{weight}-normal.woff'
    font = SourceFont(source); font.flavor = None
    path = TMP / f'{name}.ttf'; font.save(path)
    pdfmetrics.registerFont(TTFont(name, path))

WIDTH, HEIGHT = 1260, 800
LEFT, RIGHT, TOP, BOTTOM = 240, 1212, 646, 202
START, END = date(2026, 4, 1), date(2034, 4, 1)
INK, MUTED, LINE = '#24313A', '#58656D', '#CBD1D4'

def x(value):
    return LEFT + (date.fromisoformat(value) - START).days / (END - START).days * (RIGHT - LEFT)

OUT.parent.mkdir(parents=True, exist_ok=True)
pdf = canvas.Canvas(str(OUT), pagesize=(WIDTH, HEIGHT))
pdf.setTitle('Research plan comparison - fictional data')
pdf.setAuthor('edu_planning')

def text(value, xx, yy, size=14, color=INK, medium=False):
    pdf.setFillColor(HexColor(color)); pdf.setFont('PlexMedium' if medium else 'Plex', size)
    pdf.drawString(xx, yy, str(value))

def rule(xx, yy, xx2, yy2, color=LINE, width=0.7):
    pdf.setStrokeColor(HexColor(color)); pdf.setLineWidth(width)
    pdf.line(xx, yy, xx2, yy2)

def diamond(xx, yy, color, filled):
    pdf.setStrokeColor(HexColor(color)); pdf.setFillColor(HexColor(color) if filled else HexColor('#FFFFFF'))
    p = pdf.beginPath(); p.moveTo(xx, yy+5); p.lineTo(xx+5, yy); p.lineTo(xx, yy-5); p.lineTo(xx-5, yy); p.close()
    pdf.drawPath(p, stroke=1, fill=1)

for lang in ['ja', 'en']:
    text('研究計画' if lang == 'ja' else 'Research plan', 48, 748, 30, medium=True)
    text('2026年度 - 2033年度 / 仮データ' if lang == 'ja' else 'Academic years 2026-2033 / Fictional data', 48, 716, 15, MUTED)
    text('博士全体' if lang == 'ja' else 'PhD overview', 1060, 748, 16, MUTED)
    stages = ['B4'] + [f'博士{i}年' if lang == 'ja' else f'PhD {i}' for i in range(1, 6)] + [('その後' if lang == 'ja' else 'After PhD')]*2
    for i in range(9):
        xx = x(f'{2026+i}-04-01'); rule(xx, TOP, xx, BOTTOM, '#E4E7E8', .6)
        if i < 8:
            text(str(2026+i), xx+8, 684, 16, medium=True)
            text(stages[i], xx+8, 662, 13, MUTED)
    rule(48, TOP, RIGHT, TOP)
    for index, project in enumerate(DATA['projects']):
        yy = 602 - index*74
        label = project[lang]
        if lang == 'en' and pdfmetrics.stringWidth(label, 'PlexMedium', 15) > LEFT-70:
            parts = label.split(' '); first = ''
            while parts and pdfmetrics.stringWidth((first+' '+parts[0]).strip(), 'PlexMedium', 15) <= LEFT-70:
                first = (first+' '+parts.pop(0)).strip()
            text(first, 48, yy+5, 15, medium=True)
            text(' '.join(parts), 48, yy-16, 15, medium=True)
        else:
            text(label, 48, yy-5, 15, medium=True)
        rule(48, yy-33, RIGHT, yy-33)
        for period in [v for v in DATA['periods'] if v['project'] == project['id']]:
            xx = x(period['start']); end = x((date.fromisoformat(period['end'])+timedelta(days=1)).isoformat())
            pdf.setStrokeColor(HexColor(project['color'])); pdf.setFillColor(HexColor(project['color'])); pdf.setLineWidth(1.3)
            if period.get('tentative'):
                pdf.setDash(4, 3); pdf.rect(xx, yy-6, end-xx, 12, stroke=1, fill=0); pdf.setDash()
            else:
                pdf.rect(xx, yy-6, max(1, end-xx-2), 12, stroke=0, fill=1)
            text(period[lang], xx, yy+14, 12)
        for milestone in [v for v in DATA['milestones'] if v['project'] == project['id']]:
            xx = x(milestone['date'])
            if milestone['kind'] == 'event':
                pdf.setFillColor(HexColor(project['color'])); pdf.circle(xx, yy-12, 4, stroke=0, fill=1)
            else:
                diamond(xx, yy-12, project['color'], milestone['kind'] == 'deadline')
            # Publication labels below their markers, away from the dissertation bar.
            text(milestone[lang], xx+10, yy-16, 12)
            text(milestone['date'], xx+10, yy-30, 10, MUTED)
    rule(48, 172, RIGHT, 172)
    labels = ['期間', '正式締切', '目標日', '開催日', '予定（未確定）'] if lang == 'ja' else ['Period', 'Submission deadline', 'Target date', 'Event', 'Tentative']
    text('凡例' if lang == 'ja' else 'Legend', 48, 143, 13, medium=True)
    for i, label in enumerate(labels):
        xx = 150+i*202
        if i == 0:
            pdf.setFillColor(HexColor(MUTED)); pdf.rect(xx, 143, 24, 6, stroke=0, fill=1)
        elif i in [1, 2]: diamond(xx+8, 146, MUTED, i == 1)
        elif i == 3:
            pdf.setFillColor(HexColor(MUTED)); pdf.circle(xx+8, 146, 4, stroke=0, fill=1)
        else:
            pdf.setDash(3, 2); pdf.setStrokeColor(HexColor(MUTED)); pdf.rect(xx, 141, 24, 10, stroke=1, fill=0); pdf.setDash()
        text(label, xx+32, 141, 12)
    text('直近：論文A 6月30日（目標） / 奨学金A 7月15日（正式締切）' if lang == 'ja' else 'Upcoming: Paper A June 30 (target) / Fellowship A July 15 (submission deadline)', 48, 100, 15)
    text('実際の募集日程・研究計画ではありません。日付と課題名は比較用の仮データです。' if lang == 'ja' else 'All dates, project names and tasks are fictional. This is a design comparison.', 48, 58, 12, MUTED)
    pdf.showPage()
pdf.save()
print(OUT)
