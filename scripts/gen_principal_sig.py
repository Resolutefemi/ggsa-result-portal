"""
Generate a stylish principal signature image and the school logo header asset.
"""
from PIL import Image, ImageDraw, ImageFont
import os

# === PRINCIPAL SIGNATURE ===
sig_w, sig_h = 600, 200
sig = Image.new("RGBA", (sig_w, sig_h), (255, 255, 255, 0))
draw = ImageDraw.Draw(sig)

font_paths = [
    "/usr/share/fonts/truetype/lxgw-wenkai/LXGWWenKai-Regular.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold-Oblique.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Oblique.ttf",
    "/usr/share/fonts/truetype/english/Tinos-Italic.ttf",
]
font = None
for fp in font_paths:
    if os.path.exists(fp):
        try:
            font = ImageFont.truetype(fp, 64)
            print(f"Using font: {fp}")
            break
        except Exception as e:
            print(f"Font load failed {fp}: {e}")

if font is None:
    font = ImageFont.load_default()

text = "Principal"
ink = (20, 30, 80, 230)

bbox = draw.textbbox((0, 0), text, font=font)
text_w = bbox[2] - bbox[0]
text_h = bbox[3] - bbox[1]
x = (sig_w - text_w) // 2 - 40
y = (sig_h - text_h) // 2 - 20

draw.text((x, y), text, font=font, fill=ink)

draw.line([(x - 10, y + text_h + 10), (x + text_w + 80, y + text_h + 10)], fill=ink, width=3)
draw.arc([x + text_w + 60, y + text_h - 10, x + text_w + 100, y + text_h + 30], 0, 180, fill=ink, width=3)

out_path = "/home/z/my-project/public/principal-signature.png"
sig.save(out_path, "PNG")
print(f"Principal signature saved to {out_path}")

# Principal stamp/seal
stamp_w, stamp_h = 300, 300
stamp = Image.new("RGBA", (stamp_w, stamp_h), (255, 255, 255, 0))
sdraw = ImageDraw.Draw(stamp)
sdraw.ellipse([10, 10, stamp_w-10, stamp_h-10], outline=(120, 0, 0, 200), width=4)
sdraw.ellipse([25, 25, stamp_w-25, stamp_h-25], outline=(120, 0, 0, 200), width=2)
sfont_paths = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
]
sfont = None
for fp in sfont_paths:
    if os.path.exists(fp):
        try:
            sfont = ImageFont.truetype(fp, 22)
            break
        except:
            pass
if sfont is None:
    sfont = ImageFont.load_default()

sdraw.text((60, 120), "PRINCIPAL", font=sfont, fill=(120, 0, 0, 200))
sdraw.text((75, 160), "G.G.S.A", font=sfont, fill=(120, 0, 0, 200))

stamp_path = "/home/z/my-project/public/principal-stamp.png"
stamp.save(stamp_path, "PNG")
print(f"Principal stamp saved to {stamp_path}")

print("Done.")
