"""Generates realistic CT scan images in frontend/public/ct_scans/ for the In-App Patient Repository."""

import os
from PIL import Image, ImageDraw, ImageFilter
import math

os.makedirs("frontend/public/ct_scans", exist_ok=True)

def draw_ct_scan(filename, is_female=False, lesion_type="hcc"):
    w, h = 512, 512
    img = Image.new("L", (w, h), color=10)
    draw = ImageDraw.Draw(img)

    # Abdominal body outline (CT tissue density HU simulation)
    draw.ellipse([50, 60, 462, 452], fill=40, outline=90, width=8) # Body wall
    draw.ellipse([80, 90, 432, 422], fill=65) # Internal organs cavity
    
    # Spine bone (Hyperdense HU ~800)
    draw.ellipse([230, 360, 282, 412], fill=230, outline=255, width=4)
    
    # Liver tissue (Right lobe hypodense parenchyma HU ~50-60)
    draw.polygon([(120, 110), (410, 120), (390, 350), (200, 340)], fill=95)
    
    # Spleen (Left posterior HU ~45)
    draw.polygon([(90, 220), (160, 200), (170, 310), (100, 300)], fill=75)
    
    # Portal & Hepatic Veins (Contrast hyperenhancement HU ~150)
    draw.line([(240, 200), (320, 160)], fill=170, width=6)
    draw.line([(240, 200), (340, 240)], fill=165, width=5)

    # Cancer Lesion Focus
    if lesion_type == "hcc":
        # Rim-enhancing hypervascular HCC focal lesion in Segment VI
        draw.ellipse([300, 180, 380, 260], fill=140, outline=210, width=6)
        draw.ellipse([325, 205, 355, 235], fill=80) # Central necrosis
    elif lesion_type == "hemangioma":
        # Peripheral nodular enhancement hemangioma
        draw.ellipse([140, 140, 200, 200], fill=160, outline=230, width=5)
    else:
        # Multiple targetoid metastases
        draw.ellipse([280, 150, 330, 200], fill=130, outline=190, width=4)
        draw.ellipse([340, 240, 385, 285], fill=125, outline=180, width=4)

    # Gaussian blur for realistic DICOM CT texture smoothing
    img = img.filter(ImageFilter.GaussianBlur(radius=1.8))
    
    img_rgb = img.convert("RGB")
    out_path = os.path.join("frontend/public/ct_scans", filename)
    img_rgb.save(out_path, quality=95)
    print(f"Saved CT scan: {out_path}")

draw_ct_scan("james_morrison_ct.jpg", is_female=False, lesion_type="hcc")
draw_ct_scan("eleanor_vance_ct.jpg", is_female=True, lesion_type="hemangioma")
draw_ct_scan("robert_chen_ct.jpg", is_female=False, lesion_type="metastasis")
draw_ct_scan("maria_santos_ct.jpg", is_female=True, lesion_type="hcc")
