"""
Remove the white/light background from the school logo and save as transparent PNG.
Aggressive: removes any pixel whose RGB brightness is high (light), leaving only
the darker parts of the logo (text, eagle, torch, sun outline, etc.).

Output: /home/z/my-project/public/logo.png (transparent background)
"""
from PIL import Image
import os

src_path = '/home/z/my-project/upload/logo.jpeg'
out_path = '/home/z/my-project/public/logo.png'

img = Image.open(src_path).convert('RGBA')
w, h = img.size
print(f"Source size: {w}x{h}")

# Convert to RGBA pixel array
pixels = img.load()

# Strategy: For each pixel, compute brightness. If brightness is high (light),
# make it transparent (alpha=0). For mid-brightness pixels, scale alpha to
# smoothly fade out the JPEG artifacts at the logo edge.

# Brightness threshold: above this is treated as background
# The original logo has white areas INSIDE (book pages) that should also be transparent
# since the user wants ONLY the logo to stand (no white background anywhere).
BRIGHT_THRESHOLD = 220   # alpha = 0
MID_THRESHOLD = 200      # transition zone

for y in range(h):
    for x in range(w):
        r, g, b, a = pixels[x, y]
        brightness = (r + g + b) / 3
        if brightness >= BRIGHT_THRESHOLD:
            # Fully transparent
            pixels[x, y] = (r, g, b, 0)
        elif brightness >= MID_THRESHOLD:
            # Fade out
            # Map [MID, BRIGHT) -> [255, 0] alpha
            t = (brightness - MID_THRESHOLD) / (BRIGHT_THRESHOLD - MID_THRESHOLD)
            new_alpha = int(255 * (1 - t))
            pixels[x, y] = (r, g, b, new_alpha)
        # else: keep fully opaque

img.save(out_path, 'PNG')
print(f"Saved transparent logo: {out_path}")
print(f"File size: {os.path.getsize(out_path)} bytes")

# Also a small version
small = img.copy()
small.thumbnail((256, 256), Image.LANCZOS)
small.save('/home/z/my-project/public/logo-small.png', 'PNG')
print(f"Saved small logo: /home/z/my-project/public/logo-small.png ({small.size})")
