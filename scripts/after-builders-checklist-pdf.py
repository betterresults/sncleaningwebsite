# One off printable A4 for the after builders cleaning checklist.
# Run from the repo root: python3 scripts/after-builders-checklist-pdf.py
# Needs reportlab locally. Not part of npm run build, and not a production dependency.
import json, os, re, subprocess
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, Flowable

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
raw = subprocess.check_output([
    'node', '-e',
    "const c=require('./data/after-builders-checklist');"
    "process.stdout.write(JSON.stringify({title:c.TITLE,h1:c.H1,author:'Silvia Nedeva',oven:c.OVEN_NOTE,intro:c.PDF_INTRO,"
    "sections:c.sections.map(s=>({name:s.name,tasks:s.tasks.map(t=>t.text)}))}))"
], cwd=root)
data = json.loads(raw)
tasks = [t for s in data['sections'] for t in s['tasks']]
if len(tasks) != 25:
    raise SystemExit('checklist must have 25 tasks, got %d' % len(tasks))
if any('£' in t or '£' in s['name'] for s in data['sections'] for t in s['tasks']):
    raise SystemExit('task text must not contain a price')
if any('£' in data[key] for key in ('title', 'oven', 'h1', 'intro')):
    raise SystemExit('title, heading, oven note and intro must not contain a price')
names = [s['name'] for s in data['sections']]
for required in [
    'Whole property, debris and dust',
    'Kitchen',
    'Bathrooms',
    'Rooms, doors and woodwork',
    'Hallway, stairs and handover',
]:
    if required not in names:
        raise SystemExit('missing section: ' + required)
if 'optional add on' not in data['oven'].lower() or 'standalone' not in data['oven'].lower():
    raise SystemExit('oven note must say the oven clean is an optional add on, not a standalone service')

HYPHEN = re.compile(r'[A-Za-z0-9]-[A-Za-z0-9]')

def visible_hyphen(label, text):
    stripped = re.sub(r'https?://\S+', ' ', text)
    stripped = re.sub(r'/[a-z0-9][a-z0-9\-/]*', ' ', stripped, flags=re.I)
    if HYPHEN.search(stripped):
        raise SystemExit('compound hyphen in ' + label + ': ' + text)

for key in ('title', 'h1', 'oven', 'intro'):
    visible_hyphen(key, data[key])
for section in data['sections']:
    visible_hyphen('section', section['name'])
    for text in section['tasks']:
        visible_hyphen('task', text)

out = os.path.join(root, 'public', 'downloads', 'sn-cleaning-after-builders-cleaning-checklist.pdf')
os.makedirs(os.path.dirname(out), exist_ok=True)

ink = colors.HexColor('#14302c')
teal = colors.HexColor('#1f6b66')
sand = colors.HexColor('#f4f1eb')
line = colors.HexColor('#e2ddd3')
muted = colors.HexColor('#55635f')
white = colors.white

ss = getSampleStyleSheet()
title_style = ParagraphStyle('title', parent=ss['Title'], fontName='Times-Bold', textColor=ink, fontSize=16, leading=19, alignment=0, spaceAfter=2)
byline = ParagraphStyle('byline', parent=ss['BodyText'], fontName='Times-Italic', textColor=muted, fontSize=9, leading=12, spaceAfter=6)
body = ParagraphStyle('body', parent=ss['BodyText'], fontName='Times-Roman', textColor=ink, fontSize=9, leading=12, spaceAfter=4)
note = ParagraphStyle('note', parent=body, textColor=teal, fontSize=8.5, leading=11, spaceBefore=2, spaceAfter=8)
section_style = ParagraphStyle('section', parent=ss['Heading2'], fontName='Times-Bold', textColor=ink, fontSize=11, leading=14, spaceBefore=0, spaceAfter=0)
task_style = ParagraphStyle('task', parent=ss['BodyText'], fontName='Times-Roman', textColor=ink, fontSize=8.5, leading=11)
head_style = ParagraphStyle('head', parent=task_style, fontName='Times-Bold', fontSize=8, textColor=teal)
footer_style_size = 7.5

class CheckBox(Flowable):
    def __init__(self, size=3.4 * mm):
        super().__init__()
        self.size = size
    def wrap(self, aw, ah):
        return (self.size, self.size)
    def draw(self):
        self.canv.setStrokeColor(ink)
        self.canv.setLineWidth(0.7)
        self.canv.rect(0, 0, self.size, self.size)

def esc(text):
    return (text.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;'))

story = []
logo_path = os.path.join(root, 'public', 'images', 'logo-mark.png')
if not os.path.exists(logo_path):
    raise SystemExit('missing logo: ' + logo_path)
logo = Image(logo_path, width=14 * mm, height=14 * mm)
logo.hAlign = 'LEFT'
brand = Paragraph('<font color="#1f6b66"><b>SN Cleaning Services</b></font><br/>London &amp; Essex', byline)
banner = Table([[logo, brand]], colWidths=[16 * mm, (A4[0] - 32 * mm) - 16 * mm])
banner.setStyle(TableStyle([
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 0),
    ('RIGHTPADDING', (0, 0), (-1, -1), 0),
    ('TOPPADDING', (0, 0), (-1, -1), 0),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
    ('BACKGROUND', (0, 0), (-1, -1), sand),
    ('LEFTPADDING', (0, 0), (0, 0), 3 * mm),
    ('RIGHTPADDING', (0, 0), (-1, -1), 3 * mm),
    ('TOPPADDING', (0, 0), (-1, -1), 2.5 * mm),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 2.5 * mm),
]))
story.append(banner)
story.append(Spacer(1, 4 * mm))

story.append(Paragraph(esc(data['title']), title_style))
story.append(Paragraph('By Silvia Nedeva, SN Cleaning Services', byline))
story.append(Paragraph(esc(data['intro']), body))
story.append(Paragraph(esc(data['oven']), note))

usable = A4[0] - 32 * mm
done_w = 18 * mm
task_w = usable - done_w

for section in data['sections']:
    rows = [[Paragraph(esc(section['name']), section_style), Paragraph('Done', head_style)]]
    for text in section['tasks']:
        rows.append([Paragraph(esc(text), task_style), CheckBox()])
    table = Table(rows, colWidths=[task_w, done_w], repeatRows=1)
    style = [
        ('BACKGROUND', (0, 0), (-1, 0), sand),
        ('TEXTCOLOR', (0, 0), (-1, 0), ink),
        ('VALIGN', (0, 0), (-1, 0), 'MIDDLE'),
        ('VALIGN', (0, 1), (0, -1), 'MIDDLE'),
        ('VALIGN', (1, 1), (1, -1), 'MIDDLE'),
        ('ALIGN', (1, 0), (1, -1), 'CENTER'),
        ('LEFTPADDING', (0, 0), (-1, -1), 2.2 * mm),
        ('RIGHTPADDING', (0, 0), (-1, -1), 1.5 * mm),
        ('TOPPADDING', (0, 0), (-1, -1), 1.15 * mm),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 1.15 * mm),
        ('LINEBELOW', (0, 0), (-1, -2), 0.3, line),
        ('LINEBELOW', (0, -1), (-1, -1), 0.6, teal),
        ('BACKGROUND', (0, 1), (-1, -1), white),
    ]
    table.setStyle(TableStyle(style))
    story.append(Spacer(1, 1.6 * mm))
    story.append(table)

CANON = 'https://sncleaningservices.co.uk/after-builders-cleaning-checklist/'
CONTACT = '020 3835 5033 · info@sncleaningservices.co.uk · 15A Shenfield Road, Brentwood, Essex CM15 8AG'
OVEN = data['oven']
visible_hyphen('contact', CONTACT)
if '£' in CONTACT or '£' in CANON or '£' in OVEN:
    raise SystemExit('footer must not contain a price')

def wrap_words(text, canvas, font, size, width):
    words = text.split()
    lines = []
    current = ''
    for word in words:
        trial = word if not current else current + ' ' + word
        if canvas.stringWidth(trial, font, size) <= width:
            current = trial
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines

def draw_footer(canvas, doc, later=False):
    canvas.saveState()
    if later:
        canvas.setFillColor(ink)
        canvas.setFont('Times-Bold', 9)
        canvas.drawString(16 * mm, A4[1] - 10 * mm, data['title'])
        canvas.setStrokeColor(teal)
        canvas.setLineWidth(0.6)
        canvas.line(16 * mm, A4[1] - 12 * mm, A4[0] - 16 * mm, A4[1] - 12 * mm)
    canvas.setFillColor(sand)
    canvas.rect(0, 0, A4[0], 26 * mm, fill=1, stroke=0)
    canvas.setFillColor(teal)
    canvas.rect(0, 26 * mm, A4[0], 1.2, fill=1, stroke=0)
    canvas.setFillColor(ink)
    canvas.setFont('Times-Roman', footer_style_size)
    canvas.drawString(16 * mm, 20.2 * mm, CANON)
    canvas.setFillColor(muted)
    canvas.setFont('Times-Roman', 7)
    canvas.drawString(16 * mm, 16.4 * mm, CONTACT)
    canvas.setFillColor(teal)
    canvas.setFont('Times-Roman', 6.5)
    width = A4[0] - 32 * mm
    lines = wrap_words(OVEN, canvas, 'Times-Roman', 6.5, width)
    y = 12.2 * mm
    for line_text in lines[:3]:
        canvas.drawString(16 * mm, y, line_text)
        y -= 2.8 * mm
    canvas.setFillColor(ink)
    canvas.setFont('Times-Roman', 8)
    canvas.drawRightString(A4[0] - 16 * mm, 20.2 * mm, '%d' % canvas.getPageNumber())
    canvas.restoreState()

doc = SimpleDocTemplate(
    out, pagesize=A4,
    leftMargin=16 * mm, rightMargin=16 * mm,
    topMargin=16 * mm, bottomMargin=30 * mm,
    title=data['title'],
    author='Silvia Nedeva',
    subject='Room by room after builders cleaning checklist for renovations in London and Essex. No prices in the task list.',
    creator='SN Cleaning Services'
)
doc.build(story, onFirstPage=lambda c, d: draw_footer(c, d, False), onLaterPages=lambda c, d: draw_footer(c, d, True))
if not os.path.exists(out) or os.path.getsize(out) < 1000:
    raise SystemExit('PDF missing or empty')
with open(out, 'rb') as handle:
    header = handle.read(5)
    handle.seek(0)
    blob = handle.read()
if header != b'%PDF-':
    raise SystemExit('PDF header is not valid')
if b'\xc2\xa3' in blob or b'\xa3' in blob:
    raise SystemExit('PDF bytes contain a pound sign')
print('wrote', out, os.path.getsize(out))
