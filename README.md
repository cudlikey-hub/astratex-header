# Astratex — hlavička a hero (prototyp)

Statický prototyp hlavičky, hero carouselu, mega menu, šuplíku s kupóny
a USP sekce e‑shopu Astratex, postavený 1:1 podle návrhu ve Figmě.
Čisté HTML, CSS a JS — žádný build, žádné závislosti.

**Rozpracovaná interní ukázka.** Stránka má `noindex` a `robots.txt`, takže
se k ní nedostane nikdo, kdo nedostal odkaz.

## Spuštění lokálně

```bash
python3 serve.py
# → http://localhost:5173
```

Nebo jakýkoli jiný statický server; `index.html` nepotřebuje nic dalšího.

## Co je kde

| Soubor | Obsah |
|---|---|
| `index.html` | celá stránka, každý prvek nese `data-node-id` z Figmy |
| `styles.css` | všechny styly, komentované s odkazy na node id |
| `carousel.js` | hero carousel (3 slidy, autoplay, přepínání barvy písma) |
| `menu.js` | mega menu „Dámské" |
| `drawer.js` | šuplík s kupóny |
| `header.js` | bílá hlavička po odscrollování |
| `hero-layout.js` | přepínač plná šířka ⇄ karta (klik na logo) |
| `scroll-hint.js` | šipka dole v hero |
| `coupon-tip.js` | tooltip u ikonky kupónů |
| `usp-motion.js` | nájezd USP sekce při scrollu |
| `CONTEXT.md` | podrobný záznam rozhodnutí, rozměrů a odchylek od návrhu |

Podklady z Figmy (soubor `LAkfV5lfb3ASyFinSbpyYu`) jsou stažené v
`assets/`, takže projekt na Figmě nijak nezávisí.
