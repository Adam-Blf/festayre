"""
gen_icons.py, genere les icones PWA (PNG) et le favicon a partir de la
meme geometrie que public/logo.svg : bandana blanc noue sur fond rouge.

Usage : python scripts/gen_icons.py
Sorties : public/icons/icon-192.png, icon-512.png,
          icon-maskable-512.png, src/app/favicon.ico
"""
from PIL import Image, ImageDraw

RED = (200, 16, 46, 255)      # rouge foulard #c8102e
WHITE = (255, 255, 255, 255)

def draw_logo(size: int, maskable: bool) -> Image.Image:
    """Dessine le logo a l'echelle demandee.

    maskable=True : fond plein bord a bord et motif reduit dans la
    "safe zone" centrale (80 %), exigence Android adaptive icons.
    """
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    s = size / 512  # facteur d'echelle par rapport au viewBox SVG

    # Fond : coins arrondis en usage normal, plein pour le maskable.
    if maskable:
        d.rectangle([0, 0, size, size], fill=RED)
        pad = 0.10 * size  # le motif recule dans la safe zone
        s = s * 0.80
        off = pad
    else:
        d.rounded_rectangle([0, 0, size - 1, size - 1], radius=int(112 * s), fill=RED)
        off = 0

    def pt(x: float, y: float) -> tuple[float, float]:
        return (off + x * s, off + y * s)

    # Tails du noeud (triangles approximes des courbes SVG).
    d.polygon([pt(186, 122), pt(100, 120), pt(176, 170)], fill=WHITE)
    d.polygon([pt(326, 122), pt(412, 120), pt(336, 170)], fill=WHITE)
    # Noeud.
    d.rounded_rectangle([*pt(196, 96), *pt(316, 168)], radius=int(30 * s), fill=WHITE)
    # Bandana triangulaire.
    d.polygon([pt(96, 176), pt(416, 176), pt(256, 420)], fill=WHITE)
    return img

def main() -> None:
    draw_logo(192, False).save("public/icons/icon-192.png")
    draw_logo(512, False).save("public/icons/icon-512.png")
    draw_logo(512, True).save("public/icons/icon-maskable-512.png")
    # Favicon multi-tailles.
    draw_logo(64, False).save("src/app/favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])
    print("Icones generees.")

if __name__ == "__main__":
    main()
