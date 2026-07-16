"""
Remove the background from the school logo using rembg (U2Net model).
The input is the user's godgeneral.png with a solid white background.
The output is logo-transparent.png with a true alpha channel.

rembg downloads the U2Net model on first run (~170MB) and runs it locally
via onnxruntime. No external API calls.
"""
import os
from rembg import remove, new_session

INPUT = '/home/z/my-project/upload/godgeneral.png'
OUTPUT = '/home/z/my-project/public/logo-transparent.png'

print(f"[1/3] Loading input image: {INPUT}")
with open(INPUT, 'rb') as f:
    input_bytes = f.read()
print(f"      Input size: {len(input_bytes):,} bytes")

print("[2/3] Running rembg (U2Net model — first run downloads ~170MB model)...")
# Create a session so we can show progress; u2net is the default
session = new_session(model_name='u2net')
output_bytes = remove(input_bytes, session=session)
print(f"      Output size: {len(output_bytes):,} bytes")

print(f"[3/3] Saving to: {OUTPUT}")
os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)
with open(OUTPUT, 'wb') as f:
    f.write(output_bytes)

# Verify
from PIL import Image
img = Image.open(OUTPUT)
print(f"\n✓ Done. Saved logo-transparent.png")
print(f"  Size: {img.size}, Mode: {img.mode}")
print(f"  File: {os.path.getsize(OUTPUT):,} bytes")

# Stats on transparency
if img.mode == 'RGBA':
    pixels = list(img.getdata())
    transparent = sum(1 for p in pixels if p[3] == 0)
    opaque = sum(1 for p in pixels if p[3] == 255)
    semi = len(pixels) - transparent - opaque
    total = len(pixels)
    print(f"  Transparent pixels: {transparent:,} ({transparent*100/total:.1f}%)")
    print(f"  Opaque pixels:      {opaque:,} ({opaque*100/total:.1f}%)")
    print(f"  Semi-transparent:   {semi:,} ({semi*100/total:.1f}%)")
