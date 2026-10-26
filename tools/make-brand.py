#!/usr/bin/env python3
"""Draw the app icon and splash from icons/icon-512.png and install them.

Pillow is only needed when regenerating art:
  python3 -m pip install pillow
  python3 tools/make-brand.py
"""
import os
from pathlib import Path

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    raise SystemExit('Pillow is required to regenerate icons: python3 -m pip install pillow')

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'icons' / 'icon-512.png'
INK = (7, 7, 11, 255)
SERIF = '/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf'

LAUNCHER = {
    'mipmap-mdpi': 48,
    'mipmap-hdpi': 72,
    'mipmap-xhdpi': 96,
    'mipmap-xxhdpi': 144,
    'mipmap-xxxhdpi': 192,
}
FOREGROUND = {
    'mipmap-mdpi': 108,
    'mipmap-hdpi': 162,
    'mipmap-xhdpi': 216,
    'mipmap-xxhdpi': 324,
    'mipmap-xxxhdpi': 432,
}
SPLASHES = {
    'drawable/splash.png': (480, 320),
    'drawable-land-mdpi/splash.png': (480, 320),
    'drawable-land-hdpi/splash.png': (800, 480),
    'drawable-land-xhdpi/splash.png': (1280, 720),
    'drawable-land-xxhdpi/splash.png': (1600, 960),
    'drawable-land-xxxhdpi/splash.png': (1920, 1280),
    'drawable-port-mdpi/splash.png': (320, 480),
    'drawable-port-hdpi/splash.png': (480, 800),
    'drawable-port-xhdpi/splash.png': (720, 1280),
    'drawable-port-xxhdpi/splash.png': (960, 1600),
    'drawable-port-xxxhdpi/splash.png': (1280, 1920),
}


def cover(src, size):
    image = src.copy()
    image.thumbnail((size, size), Image.Resampling.LANCZOS)
    canvas = Image.new('RGBA', (size, size), INK)
    canvas.paste(image, ((size - image.width) // 2, (size - image.height) // 2), image)
    return canvas


def splash(src, width, height):
    canvas = Image.new('RGBA', (width, height), INK)
    draw = ImageDraw.Draw(canvas)
    eye = int(min(width, height) * 0.34)
    icon = cover(src, eye)
    x = (width - eye) // 2
    y = int(height * 0.5 - eye * 0.62)
    canvas.paste(icon, (x, y), icon)
    if os.path.exists(SERIF) and min(width, height) >= 320:
        title_size = max(18, int(min(width, height) * 0.055))
        sub_size = max(12, int(title_size * 0.42))
        title_font = ImageFont.truetype(SERIF, title_size)
        sub_font = ImageFont.truetype(SERIF, sub_size)
        draw_tracked(draw, 'DYSTOPIA', title_font, width, y + eye + int(title_size * 0.35), title_size * 0.18)
        draw_tracked(draw, 'THE WAKING', sub_font, width, y + eye + int(title_size * 1.35), sub_size * 0.34, fill=(198, 163, 106, 255))
    return canvas


def draw_tracked(draw, text, font, width, top, tracking, fill=(244, 236, 223, 255)):
    widths = [font.getlength(ch) for ch in text]
    total = sum(widths) + tracking * (len(text) - 1)
    x = (width - total) / 2
    for ch, w in zip(text, widths):
        draw.text((x, top), ch, font=font, fill=fill)
        x += w + tracking


def save(image, path, keep_alpha=False):
    path.parent.mkdir(parents=True, exist_ok=True)
    out = image if keep_alpha else image.convert('RGB')
    out.save(path, 'PNG')


def main():
    src = Image.open(SRC).convert('RGBA')
    resources = ROOT / 'resources'
    icon = cover(src, 1024)
    poster = splash(src, 2732, 2732)
    save(icon, resources / 'icon.png')
    save(poster, resources / 'splash.png')

    res = ROOT / 'android' / 'app' / 'src' / 'main' / 'res'
    if res.is_dir():
        for folder, size in LAUNCHER.items():
            image = cover(src, size)
            save(image, res / folder / 'ic_launcher.png')
            save(image, res / folder / 'ic_launcher_round.png')
        for folder, size in FOREGROUND.items():
            canvas = Image.new('RGBA', (size, size), (0, 0, 0, 0))
            eye = int(size * 0.68)
            glyph = cover(src, eye)
            canvas.paste(glyph, ((size - eye) // 2, (size - eye) // 2), glyph)
            save(canvas, res / folder / 'ic_launcher_foreground.png', keep_alpha=True)
        for rel, (w, h) in SPLASHES.items():
            save(splash(src, w, h), res / rel)

    imageset = ROOT / 'ios' / 'App' / 'App' / 'Assets.xcassets' / 'Splash.imageset'
    if imageset.is_dir():
        for name in ('splash-2732x2732.png', 'splash-2732x2732-1.png', 'splash-2732x2732-2.png'):
            save(poster, imageset / name)
    iconset = ROOT / 'ios' / 'App' / 'App' / 'Assets.xcassets' / 'AppIcon.appiconset'
    if iconset.is_dir():
        save(icon, iconset / 'AppIcon-512@2x.png')

    print('wrote resources/icon.png, resources/splash.png, and native copies when present')


if __name__ == '__main__':
    main()
