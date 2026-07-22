import os
import subprocess
import json

# Paths
brain_dir = r"C:\Users\Nikhil chandra\.gemini\antigravity\brain\b4f87c5f-950d-47d3-a4e0-e177d7561304"
md_path = os.path.join(brain_dir, "customer_requirements_document.md")
html_path = os.path.join(brain_dir, "customer_requirements_document.html")
pdf_path = os.path.join(brain_dir, "customer_requirements_document.pdf")

with open(md_path, "r", encoding="utf-8") as f:
    md_content = f.read()

# Convert markdown basic elements to styled HTML
import re

def md_to_html(md):
    html = md
    # Code blocks
    html = re.sub(r'```mermaid[\s\S]*?```', '<div class="diagram-placeholder">[Architecture Flow Diagram Included in Technical Section]</div>', html)
    html = re.sub(r'```[\s\S]*?```', '', html)
    
    # Headers
    html = re.sub(r'^# (.*?)$', r'<h1 class="doc-title">\1</h1>', html, flags=re.M)
    html = re.sub(r'^## (.*?)$', r'<h2 class="section-title">\1</h2>', html, flags=re.M)
    html = re.sub(r'^### (.*?)$', r'<h3 class="subsection-title">\1</h3>', html, flags=re.M)
    
    # Alert notes
    html = re.sub(r'> \[!IMPORTANT\]\n> (.*?)$', r'<div class="alert alert-important">\1</div>', html, flags=re.M)
    
    # Blockquotes
    html = re.sub(r'> (.*?)$', r'<blockquote>\1</blockquote>', html, flags=re.M)
    
    # Bold / Italic
    html = re.sub(r'\*\*(.*?)\*\*', r'<strong>\1</strong>', html)
    html = re.sub(r'\*(.*?)\*', r'<em>\1</em>', html)
    
    # Tables parsing
    def replace_table(match):
        table_str = match.group(0)
        lines = [l.strip() for l in table_str.strip().split('\n') if l.strip()]
        if len(lines) < 2:
            return table_str
        
        headers = [h.strip() for h in lines[0].split('|')[1:-1]]
        rows = lines[2:] # Skip alignment row
        
        res = ['<table class="styled-table"><thead><tr>']
        for h in headers:
            res.append(f'<th>{h}</th>')
        res.append('</tr></thead><tbody>')
        
        for r in rows:
            cols = [c.strip() for c in r.split('|')[1:-1]]
            res.append('<tr>')
            for c in cols:
                res.append(f'<td>{c}</td>')
            res.append('</tr>')
        res.append('</tbody></table>')
        return ''.join(res)

    table_pattern = re.compile(r'(\|[^\n]+\|\n\|[-:\s|]+\|\n(\|[^\n]+\|\n?)+)')
    html = table_pattern.sub(replace_table, html)
    
    # Lists
    lines = html.split('\n')
    new_lines = []
    in_list = False
    for line in lines:
        if line.strip().startswith('- '):
            if not in_list:
                new_lines.append('<ul class="styled-list">')
                in_list = True
            new_lines.append(f'<li>{line.strip()[2:]}</li>')
        else:
            if in_list:
                new_lines.append('</ul>')
                in_list = False
            new_lines.append(line)
    if in_list:
        new_lines.append('</ul>')
    html = '\n'.join(new_lines)
    
    # Horizontal rules
    html = re.sub(r'^---$', r'<hr class="divider"/>', html, flags=re.M)
    
    # Math expressions formatting
    html = re.sub(r'\$\$(.*?)\$\$', r'<div class="math-block">\1</div>', html)
    html = re.sub(r'\$(.*?)\$', r'<code>\1</code>', html)
    
    # Paragraphs wrapping
    paragraphs = html.split('\n\n')
    p_res = []
    for p in paragraphs:
        p_str = p.strip()
        if p_str and not p_str.startswith('<') and not p_str.endswith('>'):
            p_res.append(f'<p class="body-text">{p_str}</p>')
        else:
            p_res.append(p_str)
    
    return '\n'.join(p_res)

body_html = md_to_html(md_content)

styled_document_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>YUMI DXB Fashion — Customer Requirements Document</title>
<style>
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,400&family=Inter:wght@300;400;500;600;700&display=swap');
    
    @page {{
        size: A4;
        margin: 20mm 15mm 20mm 15mm;
        @bottom-right {{
            content: "Page " counter(page);
        }}
    }}
    
    body {{
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        color: #1A1A1A;
        background-color: #FFFFFF;
        line-height: 1.6;
        font-size: 13px;
        padding: 20px;
    }}
    
    .header-banner {{
        border-bottom: 3px solid #D4A373;
        padding-bottom: 15px;
        margin-bottom: 25px;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }}
    
    .brand-logo {{
        font-family: 'Cormorant Garamond', serif;
        font-size: 28px;
        font-weight: 700;
        letter-spacing: 2px;
        color: #1B2A4A;
        text-transform: uppercase;
    }}
    
    .doc-tag {{
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 1.5px;
        color: #D4A373;
        background: #FAF8F5;
        padding: 4px 10px;
        border-radius: 4px;
        border: 1px solid rgba(212, 163, 115, 0.3);
    }}
    
    .doc-title {{
        font-family: 'Cormorant Garamond', serif;
        font-size: 32px;
        color: #1B2A4A;
        margin-top: 10px;
        margin-bottom: 5px;
        font-weight: 700;
    }}
    
    .section-title {{
        font-family: 'Cormorant Garamond', serif;
        font-size: 22px;
        color: #1B2A4A;
        border-bottom: 1px solid #E5E7EB;
        padding-bottom: 6px;
        margin-top: 30px;
        margin-bottom: 12px;
        font-weight: 600;
    }}
    
    .subsection-title {{
        font-size: 15px;
        color: #D4A373;
        margin-top: 20px;
        margin-bottom: 8px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }}
    
    .body-text {{
        margin-bottom: 12px;
        color: #374151;
    }}
    
    blockquote {{
        border-left: 4px solid #D4A373;
        background-color: #FAF8F5;
        margin: 15px 0;
        padding: 12px 18px;
        font-style: italic;
        color: #4B5563;
    }}
    
    .styled-table {{
        width: 100%;
        border-collapse: collapse;
        margin: 18px 0;
        font-size: 12px;
    }}
    
    .styled-table th {{
        background-color: #1B2A4A;
        color: #FFFFFF;
        text-align: left;
        padding: 10px 12px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }}
    
    .styled-table td {{
        padding: 10px 12px;
        border-bottom: 1px solid #E5E7EB;
        color: #374151;
    }}
    
    .styled-table tr:nth-child(even) {{
        background-color: #FAF8F5;
    }}
    
    .styled-list {{
        margin: 10px 0 15px 20px;
        padding-left: 10px;
    }}
    
    .styled-list li {{
        margin-bottom: 6px;
        color: #374151;
    }}
    
    .divider {{
        border: 0;
        height: 1px;
        background: #E5E7EB;
        margin: 25px 0;
    }}
    
    .diagram-placeholder {{
        background: #FAF8F5;
        border: 1px dashed #D4A373;
        padding: 15px;
        text-align: center;
        font-size: 11px;
        color: #D4A373;
        font-weight: 600;
        border-radius: 6px;
        margin: 15px 0;
    }}
    
    .footer-note {{
        margin-top: 40px;
        padding-top: 15px;
        border-top: 1px solid #E5E7EB;
        font-size: 10px;
        color: #9CA3AF;
        text-align: center;
    }}
</style>
</head>
<body>

<div class="header-banner">
    <div class="brand-logo">YUMI DXB FASHION</div>
    <div class="doc-tag">Specification Baseline v1.2.0</div>
</div>

{body_html}

<div class="footer-note">
    YUMI DXB Fashion — Confidential Customer Requirements Document & System Specification Baseline
</div>

</body>
</html>
"""

with open(html_path, "w", encoding="utf-8") as f:
    f.write(styled_document_html)

print("Generated HTML at:", html_path)

# Convert HTML to PDF using Edge Headless command line
edge_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
if not os.path.exists(edge_path):
    edge_path = r"C:\Program Files\Microsoft\Edge\Application\msedge.exe"

if os.path.exists(edge_path):
    cmd = [
        edge_path,
        "--headless",
        "--disable-gpu",
        "--no-pdf-header-footer",
        f"--print-to-pdf={pdf_path}",
        html_path
    ]
    print("Running Edge PDF command...")
    res = subprocess.run(cmd, capture_output=True, text=True)
    print("Return code:", res.returncode)
    if os.path.exists(pdf_path):
        print("PDF SUCCESSFULLY CREATED AT:", pdf_path)
    else:
        print("PDF creation failed:", res.stderr)
else:
    print("Edge browser executable not found at standard location.")
