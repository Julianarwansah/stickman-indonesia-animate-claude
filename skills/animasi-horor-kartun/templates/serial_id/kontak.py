"""kontak.py <prefix> <out.jpg> — gabung still <prefix><frame>.jpg berurutan frame jadi lembar kontak 8 kolom."""
import glob, re, sys
from PIL import Image
pre, out = sys.argv[1], sys.argv[2]
fs = sorted(glob.glob(pre + "*.jpg"), key=lambda p: int(re.findall(r"(\d+)\.jpg$", p)[0]))
ims = [Image.open(p) for p in fs]
w, h = ims[0].size
cols = 8; rows = (len(ims) + cols - 1) // cols
sheet = Image.new("RGB", (cols * w, rows * h))
for i, im in enumerate(ims): sheet.paste(im, ((i % cols) * w, (i // cols) * h))
sheet.thumbnail((1728, 1728 * rows)); sheet.save(out, quality=85)
