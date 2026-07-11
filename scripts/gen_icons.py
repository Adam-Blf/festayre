"""
gen_icons.py, genere les icones PWA (PNG) et le favicon depuis le logo
officiel Festayre (pin de localisation navy + foulard rouge),
fichier source : scripts/logo-mark.png (extrait du SVG de la marque).

Usage : python scripts/gen_icons.py
Sorties : public/icons/icon-192.png, icon-512.png,
          icon-maskable-512.png, src/app/favicon.ico
"""
from PIL import Image, ImageDraw

CREAM = (250, 246, 240, 255)  # fond blanc casse de la marque
MARK = "scripts/logo-mark.png"

def compose(size: int, mark_ratio: float, rounded: bool) -> Image.Image:
    """Pose le logo centre sur un fond creme.

    mark_ratio : part du canevas occupee par le logo. Les icones
    maskable exigent une "safe zone" (logo reduit a ~62 %), Android
    pouvant rogner les bords en cercle.
    """
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    if rounded:
        d.rounded_rectangle([0, 0, size - 1, size - 1], radius=int(size * 0.22), fill=CREAM)
    else:
        d.rectangle([0, 0, size, size], fill=CREAM)

    mark = Image.open(MARK).convert("RGBA")
    # L'export de la marque a un fond noir plein au lieu d'alpha :
    # on detoure. Seuil 25 : le noir de fond (~0) part, le navy du
    # pin (#15274b, composante max 75) reste intact.
    data = [
        (r, g, b, 0) if max(r, g, b) < 25 else (r, g, b, a)
        for (r, g, b, a) in mark.getdata()
    ]
    mark.putdata(data)
    target = int(size * mark_ratio)
    # Conserve le ratio du logo (il est plus haut que large).
    scale = target / max(mark.size)
    mark = mark.resize((int(mark.width * scale), int(mark.height * scale)), Image.LANCZOS)
    img.alpha_composite(
        mark, ((size - mark.width) // 2, (size - mark.height) // 2)
    )
    return img

def main() -> None:
    compose(192, 0.80, True).save("public/icons/icon-192.png")
    compose(512, 0.80, True).save("public/icons/icon-512.png")
    compose(512, 0.62, False).save("public/icons/icon-maskable-512.png")
    compose(64, 0.85, True).save(
        "src/app/favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)]
    )
    print("Icones generees depuis le logo officiel.")

if __name__ == "__main__":
    main()
