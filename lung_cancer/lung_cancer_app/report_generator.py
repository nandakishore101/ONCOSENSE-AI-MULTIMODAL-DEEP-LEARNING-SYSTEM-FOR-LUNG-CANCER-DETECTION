from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle
import os
import time

def generate_pdf_report(data):
    # data contains: prediction, cancer_type, confidence, stage, risk_level, survival_indicator, original_image, heatmap_image
    
    reports_dir = os.path.join('static', 'reports')
    os.makedirs(reports_dir, exist_ok=True)
    
    filename = f"report_{int(time.time())}.pdf"
    filepath = os.path.join(reports_dir, filename)
    
    doc = SimpleDocTemplate(filepath, pagesize=letter)
    styles = getSampleStyleSheet()
    
    # Custom Title Style
    title_style = ParagraphStyle(
        name="TitleStyle",
        fontSize=24,
        leading=28,
        alignment=1, # Center
        spaceAfter=20,
        textColor=colors.HexColor("#1e3a8a") # Tailwind blue-900
    )
    
    # Custom heading style
    heading_style = ParagraphStyle(
        name="HeadingStyle",
        fontSize=14,
        leading=18,
        spaceAfter=10,
        spaceBefore=15,
        textColor=colors.HexColor("#1e40af") # Tailwind blue-800
    )
    
    elements = []
    
    # Header
    elements.append(Paragraph("<b>AI LUNG CANCER DETECTION REPORT</b>", title_style))
    elements.append(Paragraph(f"Date Generated: {time.strftime('%Y-%m-%d %H:%M')}", styles["Normal"]))
    elements.append(Spacer(1, 20))
    
    # Results Section
    elements.append(Paragraph("<b>Diagnostic Summary</b>", heading_style))
    
    data_table = [
        ["AI Diagnosis", data.get('prediction', 'N/A')],
        ["Cancer Type", data.get('cancer_type', 'N/A')],
        ["Confidence level", f"{data.get('confidence', 0)}%"],
        ["Estimated Stage", data.get('stage', 'N/A')],
        ["Risk Level", data.get('risk_level', 'N/A')],
        ["Survival Indicator", data.get('survival_indicator', 'N/A')]
    ]
    
    t = Table(data_table, colWidths=[200, 300])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor("#475569")),
        ('TEXTCOLOR', (1, 0), (1, -1), colors.HexColor("#0f172a")),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
        ('TOPPADDING', (0, 0), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor("#e2e8f0")),
    ]))
    
    elements.append(t)
    elements.append(Spacer(1, 20))
    
    # Add imagery (Strip /static/ prefix to map to actual file system if needed)
    org_img = data.get('original_image', '')
    heat_img = data.get('heatmap_image', '')
    
    # Handle absolute vs relative paths for the images correctly
    if org_img.startswith('/'):
        # Map '/static/x' to 'static/x' inside the app folder
        org_img_path = org_img.lstrip('/')
    else:
        org_img_path = org_img

    if heat_img.startswith('/'):
        heat_img_path = heat_img.lstrip('/')
    else:
        heat_img_path = heat_img
        
    try:
        if os.path.exists(org_img_path) and os.path.exists(heat_img_path):
            elements.append(Paragraph("<b>Scan Imaging</b>", heading_style))
            
            # Using a table side by side for images
            img_data = [[Image(org_img_path, width=200, height=200), Image(heat_img_path, width=200, height=200)],
                        ["Original CT Scan", "AI Heatmap (Grad-CAM)"]]
            
            img_table = Table(img_data)
            img_table.setStyle(TableStyle([
                ('ALIGN', (0,0), (-1,-1), 'CENTER'),
                ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
                ('TEXTCOLOR', (0, 1), (-1, 1), colors.HexColor("#64748b")),
                ('FONTNAME', (0, 1), (-1, 1), 'Helvetica-Oblique'),
            ]))
            
            elements.append(img_table)
    except Exception as e:
        print(f"Error adding images to PDF: {e}")
        
    # Build
    doc.build(elements)
    
    return filepath
