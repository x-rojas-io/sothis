
from PIL import Image
import os

def crop_center(image_path, output_path, crop_box):
    try:
        img = Image.open(image_path)
        # crop_box format: (left, top, right, bottom)
        # Based on typical instagram screenshot on desktop:
        # The modal usually is centered.
        # Let's assume we want to crop the "card". 
        # For a 1920x1080 screenshot, the modal might be around 
        # Left: ~400, Top: ~100, Right: ~1500, Bottom: ~1000
        # But these are likely from the user's screen.
        
        # Let's try to find the "white/beige" box?
        # Or just crop to square if they are instagram posts?
        
        # Heuristic: The card (beige background) seems to be the main content.
        # We'll just save the raw for now if we can't be sure, but let's try a safe crop 
        # that removes the "Instagram" header and sidebar.
        
        width, height = img.size
        print(f"Processing {image_path}: {width}x{height}")
        
        # improved guess: The image user uploaded is likely the screenshot containing the UI.
        # The "modal" usually has a Close button on top right.
        # Let's crop 20% from top, 20% from bottom, 25% from left, 25% from right 
        # to isolate the center square-ish content.
        
        # actually, instagram web modal is often square or 4:5.
        
        # Let's just crop strictly to the center 1080x1080 or similar relative size.
        
        # Adjusted heuristic: Crop to center 60% width and 80% height?
        left = width * 0.25
        top = height * 0.15
        right = width * 0.75
        bottom = height * 0.85
        
        cropped = img.crop((left, top, right, bottom))
        cropped.save(output_path)
        print(f"Saved {output_path}")

    except Exception as e:
        print(f"Error processing {image_path}: {e}")

images = [
    ('public/images/services/trigger-point_raw.png', 'public/images/services/trigger-point.png'),
    ('public/images/services/deep-tissue_raw.png', 'public/images/services/deep-tissue.png'),
    ('public/images/services/sports_raw.png', 'public/images/services/sports.png'),
     ('public/images/services/benefits_es_raw.png', 'public/images/services/benefits_es.png'),
      ('public/images/services/benefits_en_raw.png', 'public/images/services/benefits_en.png'),
]

for in_path, out_path in images:
    crop_center(in_path, out_path, None)
