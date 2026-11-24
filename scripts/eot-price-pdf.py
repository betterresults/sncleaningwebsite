# Builds public/files/sn-cleaning-services-end-of-tenancy-price-list.pdf from data/eot-prices.js.
# Run from the repo root after changing prices:  python3 scripts/eot-price-pdf.py   (needs reportlab)
import json, os, subprocess
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
data = json.loads(subprocess.check_output(['node', '-e', "process.stdout.write(JSON.stringify(require('./data/eot-prices')))"], cwd=root))
out = os.path.join(root, 'public', 'files', 'sn-cleaning-services-end-of-tenancy-price-list.pdf')
os.makedirs(os.path.dirname(out), exist_ok=True)

ink = colors.HexColor('#14302c'); green = colors.HexColor('#1f6b66'); line = colors.HexColor('#e2ddd3'); sand = colors.HexColor('#f4f1eb')
ss = getSampleStyleSheet()
h1 = ParagraphStyle('h1', parent=ss['Title'], textColor=ink, fontSize=20, alignment=0, spaceAfter=4)
h2 = ParagraphStyle('h2', parent=ss['Heading2'], textColor=ink, fontSize=13, spaceBefore=10, spaceAfter=4)
body = ParagraphStyle('b', parent=ss['BodyText'], fontSize=9.5, leading=13, textColor=colors.HexColor('#33423f'))
small = ParagraphStyle('s', parent=body, fontSize=8.5, leading=11)

def money(n):
    return '£%d' % n if float(n).is_integer() else '£%.2f' % n

def table(rows, widths, header=True):
    t = Table(rows, colWidths=widths)
    st = [('FONT', (0, 0), (-1, -1), 'Helvetica', 9), ('LINEBELOW', (0, 0), (-1, -1), 0.4, line),
          ('TEXTCOLOR', (1, 0), (-1, -1), green), ('FONT', (1, 0), (-1, -1), 'Helvetica-Bold', 9),
          ('VALIGN', (0, 0), (-1, -1), 'TOP'), ('TOPPADDING', (0, 0), (-1, -1), 3), ('BOTTOMPADDING', (0, 0), (-1, -1), 3)]
    if header:
        st += [('BACKGROUND', (0, 0), (-1, 0), sand), ('FONT', (0, 0), (-1, 0), 'Helvetica-Bold', 8.5), ('TEXTCOLOR', (0, 0), (-1, 0), ink)]
    t.setStyle(TableStyle(st))
    return t

doc = SimpleDocTemplate(out, pagesize=A4, leftMargin=16*mm, rightMargin=16*mm, topMargin=14*mm, bottomMargin=14*mm,
                        title='SN Cleaning Services end of tenancy price list', author='SN Cleaning Services')
f = data['furnishing']
s = [Paragraph('End of tenancy cleaning price list', h1),
     Paragraph('SN Cleaning Services · London and Essex · sncleaningservices.co.uk/end-of-tenancy-cleaning/prices/', small),
     Spacer(1, 6),
     Paragraph('Prices are for the whole home with one bathroom, the kitchen and the living area. They are the same in London and Essex. '
               'SN Cleaning Services is not VAT registered, so no VAT is added. Every price includes the team, all products and equipment, '
               'our deposit back guarantee and a 7 day re clean at no extra cost.', body)]
for name, key in (('Flats', 'flats'), ('Houses', 'houses')):
    s += [Paragraph(name, h2), table([['Home'] + f] + [[r['label']] + [money(v) for v in r['prices']] for r in data[key]], [64*mm, 38*mm, 38*mm, 38*mm])]
s += [Paragraph('Extra rooms', h2), table([['Room'] + f] + [[r['label']] + [money(v) for v in r['prices']] for r in data['extraRooms']], [64*mm, 38*mm, 38*mm, 38*mm])]
s += [Paragraph('Oven', h2), table([[o['label'], money(o['price'])] for o in data['ovens'] if o['price']], [100*mm, 30*mm], header=False)]
for g in data['extras']:
    s += [Paragraph(g['group'], h2), table([[i['label'], money(i['price'])] for i in g['items']], [100*mm, 30*mm], header=False)]
s += [Paragraph('Good to know', h2),
      Paragraph('Same day or Sunday clean: %s extra. In London the Congestion Charge (inside the zone) and parking fees are added on top. '
                'You add your card when you book; the amount is authorised 48 hours before the clean and charged once the job is done. '
                'Key collection: free within one mile, £15 up to three miles, £25 up to five miles. Outside windows are not included.' % money(data['sameDaySunday']), body),
      Spacer(1, 6),
      Paragraph('Get your exact price and book online at sncleaningservices.co.uk, call 020 3835 5033 or email info@sncleaningservices.co.uk.', body)]
doc.build(s)
print('wrote', out)
