#!/usr/bin/env python3
"""Vyrobí figma.html — statický snímek stránky pro import do Figmy.

Importér (html.to.design) si stránku načte v prohlížeči a uloží to, co
v tu chvíli vidí. Jenže hlavička, USP sloupce, šipka i tooltip najíždějí
animací a napoprvé jsou průhledné, takže by se do Figmy dostaly jako
neviditelné vrstvy. Snímek proto nemá žádné skripty a stavy, které jinak
nastavuje JS, jsou rovnou v markupu.

Generuje se z index.html, aby se obě verze nerozešly:

    python3 make-figma-snapshot.py
"""

import re
import pathlib

ROOT = pathlib.Path(__file__).parent
src = (ROOT / "index.html").read_text(encoding="utf-8")

# 1) Pryč se skripty — nic se nesmí hýbat ani čekat na scroll.
out = re.sub(r'\n<script src="[^"]+"></script>', "", src)

# 2) Hlavička se jinak drží schovaná, než se načte fotka.
out = out.replace(' data-intro="hold"', "", 1)

# 3) Šipka dolů a tooltip u kupónů: rovnou ve viditelném stavu.
out = out.replace('<button class="scrollHint" type="button"',
                  '<button class="scrollHint is-in" type="button"', 1)
out = out.replace('<div class="tip" data-coupon-tip',
                  '<div class="tip is-in" data-coupon-tip', 1)

# 4) Ikonka kupónů drží pod tooltipem svůj zvýrazněný stav.
out = out.replace('aria-label="Kupóny" data-node-id="244:4458"',
                  'aria-label="Kupóny" data-nudge="on" data-node-id="244:4458"', 1)

# 5) Poznámka do zdroje, ať je jasné, co ten soubor je.
out = out.replace(
    "<head>",
    "<head>\n<!-- Generováno skriptem make-figma-snapshot.py — needitovat ručně.\n"
    "     Statická podoba index.html pro import do Figmy. -->",
    1,
)

(ROOT / "figma.html").write_text(out, encoding="utf-8")
print("figma.html hotovo:", len(out), "znaků")
