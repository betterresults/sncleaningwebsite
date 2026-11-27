# Printable A4 checklist for a carpet, sofa or mattress clean.
# Run from the repo root: python3 scripts/carpet-cleaning-cost-calculator-pdf.py
# Needs reportlab locally. Not part of npm run build, and not a production dependency.
# This is a checklist, not a price list: no pound sign, and no compound hyphens.
import json, os, re, subprocess
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, Flowable

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
raw = subprocess.check_output([
    'node', '-e',
    "const c=require('./data/carpet-cleaning-cost-calculator');"
    "process.stdout.write(JSON.stringify({title:c.PDF_TITLE,intro:c.PDF_INTRO,"
    "before:c.beforeVisit,work:c.work,after:c.afterVisit,reclean:c.RECLEAN_NOTE,leather:c.LEATHER_NOTE}))"
], cwd=root)
data = json.loads(raw)

if data['title'] != 'Carpet, Sofa and Mattress Cleaning Checklist':
    raise SystemExit('PDF title changed: ' + data['title'])

expected_work = {
    'Carpets': [
        'Pre inspection of type and condition',
        'Pre treatment of visible stains',
        'Vacuum loose dirt',
        'Hot water extraction or dry clean as appropriate',
        'Full fibre clean',
        'Odour treatment',
        'Fast dry',
        'Pile grooming',
        'Furniture pads on request',
    ],
    'Sofas and fabric furniture': [
        'Fabric identification',
        'Hidden area spot test',
        'Pre treat stains',
        'Fabric safe deep clean',
        'Odour treatment',
        'Seams, piping and crevices',
        'Fast dry',
        'Groom pile where applicable',
    ],
    'Mattresses': [
        'Material check',
        'Spot treatment',
        'Dust mite treatment',
        'Sanitising clean on both sides where it can be turned (one sided memory foam: accessible side only)',
        'Odour treatment',
        'Fast dry',
        'Final check',
    ],
}
names = [section['name'] for section in data['work']]
if names != list(expected_work):
    raise SystemExit('section order changed: ' + ', '.join(names))
for section in data['work']:
    if section['items'] != expected_work[section['name']]:
        raise SystemExit('published steps changed in ' + section['name'])
if data['before']['items'] != [
    'Tell us about stains',
    'Tell us about pets',
    'Tell us about parking',
    'Tell us about stairs',
    'Tell us if a mattress cannot be turned',
]:
    raise SystemExit('before the visit list changed')
if 'London and Essex' not in data['intro'] or 'combine' not in data['intro'].lower():
    raise SystemExit('intro must mention London and Essex and combining items')
if '24 hour' not in data['reclean']:
    raise SystemExit('reclean note must say 24 hour')
if 'mattress protector' not in ' '.join(data['after']['items']).lower() and 'protector' not in ' '.join(data['after']['items']).lower():
    raise SystemExit('after the visit must mention a mattress protector')

HYPHEN = re.compile(r'[A-Za-z0-9]-[A-Za-z0-9]')

def visible_hyphen(label, text):
    stripped = re.sub(r'https?://\S+', ' ', text)
    stripped = re.sub(r'/[a-z0-9][a-z0-9\-/]*', ' ', stripped, flags=re.I)
    if HYPHEN.search(stripped):
        raise SystemExit('compound hyphen in ' + label + ': ' + text)
    if '£' in text or '\u00a3' in text:
        raise SystemExit('price symbol in ' + label + ': ' + text)
    if re.search(r'\boven\b', text, re.I):
        raise SystemExit('oven mention in ' + label)

visible_hyphen('title', data['title'])
visible_hyphen('intro', data['intro'])
visible_hyphen('reclean', data['reclean'])
visible_hyphen('leather', data['leather'])
visible_hyphen('before', data['before']['name'])
for text in data['before']['items']:
    visible_hyphen('before item', text)
visible_hyphen('after', data['after']['name'])
for text in data['after']['items']:
    visible_hyphen('after item', text)
for section in data['work']:
    visible_hyphen('section', section['name'])
    if section.get('note'):
        visible_hyphen('note', section['note'])
    for text in section['items']:
        visible_hyphen('step', text)

out = os.path.join(root, 'public', 'downloads', 'sn-cleaning-carpet-cleaning-checklist.pdf')
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
note = ParagraphStyle('note', parent=body, textColor=teal, fontSize=8.5, leading=11, spaceBefore=2, spaceAfter=6)
heading = ParagraphStyle('heading', parent=ss['Heading2'], fontName='Times-Bold', textColor=ink, fontSize=13, leading=16, spaceBefore=2, spaceAfter=2)
section_style = ParagraphStyle('section', parent=ss['Heading2'], fontName='Times-Bold', textColor=ink, fontSize=11, leading=14, spaceBefore=0, spaceAfter=0)
task_style = ParagraphStyle('task', parent=ss['BodyText'], fontName='Times-Roman', textColor=ink, fontSize=8.5, leading=11)
head_style = ParagraphStyle('head', parent=task_style, fontName='Times-Bold', fontSize=8, textColor=teal)

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

def task_table(name, items):
    rows = [[Paragraph(esc(name), section_style), Paragraph('Done', head_style)]]
    for text in items:
        rows.append([Paragraph(esc(text), task_style), CheckBox()])
    table = Table(rows, colWidths=[task_w, done_w], repeatRows=1)
    table.setStyle(TableStyle([
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
    ]))
    return table

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

usable = A4[0] - 32 * mm
done_w = 18 * mm
task_w = usable - done_w

story.append(Spacer(1, 1.2 * mm))
story.append(task_table(data['before']['name'], data['before']['items']))
story.append(Spacer(1, 3 * mm))
story.append(Paragraph('What we do', heading))
for section in data['work']:
    story.append(Spacer(1, 1.6 * mm))
    story.append(task_table(section['name'], section['items']))
    if section.get('note'):
        story.append(Paragraph(esc(section['note']), note))
story.append(Spacer(1, 2 * mm))
story.append(task_table(data['after']['name'], data['after']['items']))
story.append(Spacer(1, 2 * mm))
story.append(Paragraph(esc(data['reclean']), note))

CANON = 'https://sncleaningservices.co.uk/carpet-cleaning-cost-calculator/'
CONTACT = '020 3835 5033 · info@sncleaningservices.co.uk · 15A Shenfield Road, Brentwood, Essex CM15 8AG'
visible_hyphen('contact', CONTACT)
visible_hyphen('canon', CANON)
if CANON != 'https://sncleaningservices.co.uk/carpet-cleaning-cost-calculator/':
    raise SystemExit('canonical URL changed')
if '£' in CONTACT or '£' in CANON:
    raise SystemExit('footer must not contain a price')

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
    canvas.rect(0, 0, A4[0], 18 * mm, fill=1, stroke=0)
    canvas.setFillColor(teal)
    canvas.rect(0, 18 * mm, A4[0], 1.2, fill=1, stroke=0)
    canvas.setFillColor(ink)
    canvas.setFont('Times-Roman', 7.5)
    canvas.drawString(16 * mm, 11.2 * mm, CANON)
    canvas.setFillColor(muted)
    canvas.setFont('Times-Roman', 7)
    canvas.drawString(16 * mm, 7.2 * mm, CONTACT)
    canvas.setFillColor(ink)
    canvas.setFont('Times-Roman', 8)
    canvas.drawRightString(A4[0] - 16 * mm, 11.2 * mm, '%d' % canvas.getPageNumber())
    canvas.restoreState()

doc = SimpleDocTemplate(
    out, pagesize=A4,
    leftMargin=16 * mm, rightMargin=16 * mm,
    topMargin=14 * mm, bottomMargin=22 * mm,
    title=data['title'],
    author='Silvia Nedeva',
    subject='Checklist for carpet, sofa and mattress cleaning in London and Essex.',
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
