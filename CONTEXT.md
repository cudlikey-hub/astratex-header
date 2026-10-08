# Astratex Header — kontext projektu

Záznam stavu k 22. 9. 2026. Slouží jako podklad pro pokračování práce, když se
ztratí historie konverzace.

---

## 1. Co to je a jak to spustit

Statický prototyp hlavičky a hero sekce e‑shopu Astratex, postavený 1:1 podle
Figmy. Žádný build, žádné závislosti — čisté HTML, CSS a JS.

```bash
cd "/Users/jiricondl/Desktop/PROJEKTY/UX:UI/Header" && python3 serve.py
# → http://localhost:5173
```

`serve.py` dostává cestu ke složce napevno (`functools.partial(Handler,
directory=ROOT)`). Bez toho dlouho běžící proces začne na každý požadavek
padat na `os.getcwd() → PermissionError`. Tohle už se jednou stalo.

## 2. Zdroje z Figmy

Soubor: `LAkfV5lfb3ASyFinSbpyYu` (Header)

| Node | Co to je |
|---|---|
| `244:4380` | desktop 1920px_2 — celá stránka, slide 1 (tmavá fotka) |
| `209:15132` | totéž, slide 2 (světlá fotka, tmavý ink) |
| `184:13463` | mega menu Dámské |
| `227:2570` | drawer Dostupné kupóny |
| `296:9506` | hero s černou krajkou (slide 2) |
| `375:3177` | USP sekce v3 (kruhové ikony) — platná |
| `411:12701` | vyhledávání v hlavičce (výchozí) |
| `442:3142` | vyhledávání s dotazem — starší verze |
| `455:2556` | vyhledávání s dotazem (výsledky) v2 — platná |
| `309:10328` | tooltip u ikonky kupónů |
| `342:2095` | poslední verze celé stránky |

Podklady jsem tahal přes **Figma Dev Mode MCP server na `localhost:3845`**
(běží v aplikaci Figma, Preferences → Enable Dev Mode MCP Server), ne přes
konektor v Claude — ten hlásí timeout při `tools/list`, viz sekce 8.

Pomocný skript pro dotazy na ten server je ve scratchpadu relace
(`fig.py`, `run.py`) — při ztrátě se dá triviálně napsat znovu: JSON‑RPC přes
`POST /mcp`, hlavička `Accept: application/json, text/event-stream`, nejdřív
`initialize`, pak `tools/call`.

**Assety jsou už stažené v `assets/`** a na Figmě nezávisí. Odkazy typu
`localhost:3845/assets/...` expirují.

## 3. Struktura

```
index.html      celá stránka, každý prvek nese data-node-id z Figmy
styles.css      ~1500 řádků, vše okomentované s odkazy na node id
carousel.js     hero carousel (2 slidy, autoplay, ink)
menu.js         mega menu Dámské
drawer.js       drawer s kupóny
header.js       bílá hlavička po scrollu
hero-layout.js  přepínač plná šířka ⇄ karta (logo)
usp-motion.js   nájezd USP sekce při scrollu
coupon-tip.js   tooltip u ikonky kupónů
serve.py        lokální server, port 5173
assets/         hero-1.png, hero-2.png, ikony, ink-light/, ink-dark/, menu/, drawer/
fonts/          Google Sans (Regular, Medium, SemiBold, Bold) — zkopírované ze systému
```

Inter se načítá z Google Fonts CDN (váhy 400/500/600).

## 4. Klíčové rozměry a tokeny

```css
--canvas-min: 1280px;      --canvas-max: 2560px;
--canvas-min-fit: calc(var(--canvas-min) - (100vw - 100%));  /* odečte scrollbar */
--bar-height: 72px;        /* 16 + 40 řádek + 16 */
--usp-height: calc(--usp-pad-y*2 + --usp-item-pad-y*2 + --usp-line);  /* 72px */
--hero-inset / --hero-radius: 0 → 16px v odsazené variantě
```

- **Hero** = `100dvh − hero-inset` — node `342:2097` je anotovaný „full viewport".
  USP lišta je tedy nově **pod foldem**; že jde scrollovat, říká šipka dole.
  (Dřív bylo `100dvh − usp`, aby byla lišta vždy vidět — přebito zadáním.)
- **USP** (node `375:3177`) je 319 vysoká: py 80, bez bočního odsazení,
  čtyři sloupce po 456 s rozestupem 32.
- `--canvas-min-fit` řeší, že „1280" je šířka okna včetně scrollbaru. Bez toho
  se při okně 1280 px a trvale zobrazeném posuvníku objevil vodorovný posuvník.

## 5. Chování

**Carousel** (`carousel.js`) — 3 slidy, prolnutí 900 ms, autoplay 6 s.
Pořadí: Valentýnská kolekce (tmavá) → Krajka, která padne (`296:9612`,
vínová, zrcadlená vodorovně přes `--flip: -1`) → Nákupní dny (světlá).
Kód je psaný obecně přes `slides.length`, přidání dalšího slidu znamená
jen slide + set + tečku v markupu a jeden řádek s ořezem v CSS.
Pauza má oddělené důvody (`holds`): hover nad textem/tečkami/šipkami,
fokus z klávesnice, skrytá záložka, otevřené menu, otevřený drawer.
Po pauze pokračuje **se zbývajícím časem**, minimálně 1,5 s. Původní verze
měla jeden sdílený flag a pauzu na celém hero — carousel se pak zastavoval,
kdykoli byl kurzor kdekoli na fotce.

**Ink** — `data-ink` na `.page` podle slidu. Světlá fotka → text a ikony
`#151515`, titulek `#000`, CTA bílé s černým textem. Ikony jsou dvě exportované
sady (`ink-light/`, `ink-dark/`), které se prolínají opacitou.

**Hlavička** — `position: fixed` (ne sticky, `.page` má `overflow: hidden`).
Po scrollu nad 32 px se po 220 ms zpoždění podbarví bíle (`header.js`).
Zpoždění brání reakci na cuknutí kolečkem.

**Mega menu** (`menu.js`) — otevírá „Dámské", rozbaluje se `clip-path`
odshora, sloupce najíždějí se zpožděním. Overlay 50 %, linka `#D0D0D2` pod
hlavičkou. Stránka pod menu se drží blokováním vstupů, **ne** `overflow:
hidden` — to bralo scrollbar a vznikl bílý pruh vpravo.

**Vyhledávání** (`search.js`, node `411:12701`) — otevírá lupa v hlavičce,
odkrývá se shora stejným `clip-path` jako mega menu a sdílí s ním overlay,
bílou hlavičku i držení stránky. Panel má p40, pole 1840 × 56 se spodní
linkou 1px N900. Panel leží na `z-index: 11`, tedy **nad lištou** (10) —
tím překryje tooltip u kupónů, který z lišty visí dolů; tooltip se proto
nemusí zavírat a po zavření panelu je zase vidět.

Nájezd obsahu: **linka se natáhne zleva doprava** (`searchLine`, 620 ms,
jako by se načítala), pak zleva naskáčou řádky s chipy, popisek
„Doporučené" a karty po 70 ms (`searchIn`).

Panel má **dva stavy** (`data-query` na panelu): prázdné pole = „Naposledy
hledané" a doporučené produkty (`411:12701`), cokoli napsaného = stav
s výsledky (`455:2556`). Řádek „Lidé často hledají", který měl návrh pod
historií, je na zadání **pryč**; po vymazání historie proto zmizí i prázdný
obal řádků, aby nad „Doporučené" nezůstala mezera 40. Přepíná se `display`, takže se nájezd zleva
přehraje znovu — animace se u znovuzobrazeného prvku spouští od začátku.
Křížek nejdřív uklidí dotaz a vrátí výchozí obsah; teprve z prázdného pole
zavře celý panel. Zavřený panel se vždy vrací do výchozího stavu.

**Stav s výsledky** (`455:2556`) má nahoře hlavičku „Nalezené produkty (32)"
s odkazem „zobrazit vše" a pásek pěti karet se šipkami, **pod nimi** dva
řádky odkazů — „Doporučené kategorie" a „Astratex magazín", v obou dva chipy
se šipkou. Návrh je má nad produkty; dolů je přesunulo zadání, odsazení 40
zůstalo stejné. V odkazech i v názvech produktů je **hledaný řetězec tučně**
(`<b>` uvnitř `.searchChip__text` / `.searchCard__name`), jak to má návrh.

Pořadí nájezdu kopíruje pořadí na stránce. Výchozí stav: řádek historie (0),
popisek Doporučené (1), karty (2+). Stav s výsledky: hlavička (0), karty
(1+), řádky odkazů (7, 8); bannery v obou (8+).

**Bannery jsou jen ve stavu s dotazem** (`455:2673`) — vážou se k tomu, co
uživatel hledá. Výchozí stav je bez nich na celou šířku 1840; stav s výsledky
má 1360 + 80 + 400. Oba jsou při 1920 přesně 400 × 225, r8, text vlevo
(28/32 semibold + 17/21 regular, doslova černá) a vpravo dole skleněné
kolečko 40 se šipkou otočenou o −45°.

**Sloupec bannerů se zmenšuje poměrově.** Není napevno 400 px, ale drží svůj
podíl z šířky panelu — `clamp(220px, 21.739%, 400px)`, tedy 400 / 1840 z
návrhu. Uvnitř se měří v `cqw` (banner je sám sobě `container-type:
inline-size`), takže se s ním poměrově zmenší úplně všechno včetně písma:
1 cqw = 4 px při šířce 400, čísla z Figmy jsou dělená čtyřmi (42 px →
10,5 cqw, 28 px → 7 cqw). Výšku drží `aspect-ratio: 400 / 225`. Na 1280
vyjde banner 257,6 × 144,9 a produktová karta se tím zvedne ze 120,6 na
147,1 px. Pod ~1110 px drží banner dolní mez 220 px kvůli čitelnosti textu.
**Poloměr rohů se nezmenšuje** — je napevno **6 px**, sjednocený
s produktovými kartami (návrh má u bannerů 8). Kdyby se přepočítával
poměrově, vypadal by při 1280 jako jiný tvar.

První má podklad `#f7f3f2` a dvě vrstvy fotky (scéna
+ vyříznutá modelka) skrz **rozostřenou masku z návrhu**
(`assets/banners/banner-lace-mask.svg`, `mask-size: 233.6 × 243.6`,
`mask-position: 134.699px 268.7px`), takže fotka vlevo měkce končí. Druhý má
přechod `to left` z `#e7d8d4` do `#f7f3f2` a dvě vyříznuté PNG (křeslo
a modelka). Na **hover** se přiblíží na 1,05 (480 ms) **celá grafika**, ne
jen obsah výřezu — všechny vrstvy sedí v obalu `.searchBanner__layers`
o rozměru banneru a zvětšuje se ten, takže roste i maska a hrany vrstev.
Zároveň kolečko ztmavne na 42/42/42 68 % a šipka popojede o 3 px svým směrem.

**Produkty v pásku** — šest skutečných produktů z návrhu (fotky i videa
jsou v `assets/products/`, originály ve `fotky/produkty/`). Ve výchozím
stavu je fotka, při najetí myší se přes ni prolne video (240 ms) a po
odjetí se zastaví a převine na začátek. **Platí to pro oba stavy panelu** —
výchozí pásek i karty mezi výsledky mají stejné fotky, videa i hover.

Kromě toho běží **ukázka**: po otevření panelu se sama spustí jedna náhodná
karta (jen z těch, které jsou zrovna v záběru pásku), a když video dojede,
po pauze naskočí jiná — nikdy ta samá dvakrát po sobě. Hraje vždy **nejvýš
jedno video**; hover má přednost, ukázka se při něm vrátí na fotku a po
odjetí se po 1,6 s rozjede znovu. Pod kurzorem video běží dokola, ukázka
jen jednou (`loop` řídí skript, proto není v markupu). Ukázka se vybírá
jen z karet, které jsou právě vidět — tedy z aktivního stavu panelu
(`offsetParent`) a ze záběru vlastního pásku; když se zrovna nehodí
(skrytá záložka, kurzor na kartě, nic v záběru), zkusí to za 1,2 s znovu,
aby jedno nevhodné kolo ukázku neumlčelo nadobro. Karta bez videa se
při najetí místo toho lehce přiblíží (`--card-zoom-scale`, 480 ms); vybírá
je `:not(:has(.searchCard__video))`. Všechny karty mají `cursor: pointer`. Zavřený panel a
skrytá záložka ukázku zastaví, `prefers-reduced-motion` ji nespustí vůbec. Videa mají `preload="none"` — je
jich pět po ~15 MB a bez najetí nemají proč se stahovat. Párování podle
názvu souboru; **„Krajková podprsenka evolution" video nemá**, takže u ní
zůstane fotka. Dotykových zařízení se to netýká, hover tam není.

**Název produktu má dva řádky** (`line-clamp: 2`), delší se uřízne třemi
tečkami; platí v obou stavech panelu. Místo na druhý řádek se **nerezervuje**
— krátký název zabere jeden řádek a text pod ním vyjede nahoru. Ceny tím
pádem u karet s různě dlouhým názvem nestojí na jedné lince; je to vědomá
volba, prázdná mezera pod krátkými názvy vypadala hůř.

`serve.py` kvůli videu umí **Range** (206) — bez toho posílal vždy celý
soubor a nešlo přetáčet.

**Pásky jsou dva** — ve výchozím stavu i mezi výsledky — a každý se
obsluhuje sám za sebe (`[data-strip]`). Ve výsledcích je v záběru **pět**
karet (1360 = 5 × 249,6 + 4 × 28), krok je 1098 px.

**Pásek doporučených** — šest karet v záběru (1840 = 6 × 283,33 + 5 × 28),
zbytek se odjíždí do strany. Posuvník je schovaný, posouvají šipky
`Button / Sharp&Round` (40 kolečko, černá 16 %, bílý lem, rozostřené pozadí)
vycentrované **středem na hraně fotky**, tedy půlkou přes okraj. Pravá je vidět vždy, levá se objeví, jakmile se
pásek pohne, a na nule zase zmizí. Krok je jedna obrazovka bez jedné karty,
aby zůstal záchytný bod.

Svisle visí šipky na **šířce** pásku, ne na jeho výšce: `top: 0` a
`margin-top: calc(0.75 * šířka karty)` — procenta v `margin-top` se počítají
ze šířky, kdežto v `top` z výšky. Fotka má poměr 20/30, takže 0,75 × šířka
karty je přesně její půlka. Na textu pod fotkou tím pádem nezáleží; dřív
stačilo, aby se na užší obrazovce zalomila cena, a šipka spadla o 12 px.

**Drawer** (`drawer.js`) — otevírá ikona kupónů, vyjíždí zprava, overlay 50 %,
vlastní tenký posuvník (4×64, `rgba(42,42,42,.72)`), dole bílý přechod 283 px,
který mizí na konci seznamu. Fokus zůstává uvnitř, Esc zavírá.

**Přepínač rozvržení** (`hero-layout.js`) — klik na logo přepne hero na kartu
s odsazením 16 px a zaoblením 16 px. Přechod běží **jen během přepnutí**
(třída `is-hero-morphing`); jinak by se výška hero animovala i při změně
velikosti okna. V odsazené variantě jdou hlavička i menu dál od okraje
k okraji a odsazení karty se u nich projeví ve vnitřním odsazení a výšce.

**USP** (`375:3177`) — čtyři sloupce (flex 1, px 16, py 8): kruh 72 px
v N100 s ikonou 31,5, pod ním 12 px mezera a text na střed (24/32 SemiBold
N900 + 21/25 Regular N700, mezi sebou 2 px).

**Pohyb v USP** — tři vrstvy, všechny vypnuté při `prefers-reduced-motion`:

1. **Nájezd** (`usp-motion.js`) — `IntersectionObserver` při 35 % viditelnosti
   přepne `data-motion` na `"in"`. Text přijede shora (−16 px), kruh za ním
   o 110 ms později zespodu (+24 px, scale 0.94) — vypadá to, že se ikona
   vynoří z textu. Sloupce jdou po sobě po 90 ms. Jednorázově, observer se
   pak odpojí.
2. **Mlha** — `.usp__fog` má dvě vrstvy s SVG filtry `#uspFogA` / `#uspFogB`
   (v `index.html`): `feTurbulence` dělá oblačný šum, `feColorMatrix` z něj
   vezme jeden kanál jako průhlednost a obarví ho na světlou šedou. Vrstvy
   se posouvají, zvětšují a otáčejí (14 / 19 s), animuje se jen `transform`,
   takže prohlížeč šum vykreslí jednou. Kontrast se ladí v `feColorMatrix`
   (poslední řádek = strmost a posun alfy), hustota v `baseFrequency`
   a měkkost v `feGaussianBlur` — má to být rozmazaná mlha, ne zrno
   (`numOctaves` 2, blur 5 a 6,5). Předchozí verze byly zamítnuté:
   barevné kapky (moc barvy), jednobarevné kapky = „tekuté sklo" (málo
   vidět) a ostrý šum (moc struktury). Kruh **nemá ostrý okraj** —
   `mask-image` nechá barvu v posledních pixelech vytratit, takže kotouč
   splývá s bílou; lesklý lem ani horní světlo tam nejsou, dělaly z toho kov.
   Smyčka je uzavřená (0 % = 100 %, rotace 0 → 360°) a časování `linear`:
   s `ease-in-out` se u každého klíče na okamžik zastavila a na konci cyklu
   skákala. Žádný WebGL — dvě vrstvy místo canvasu se shaderem.
3. **Podpisový pohyb ikon běží sám dokola**, hover ho nespouští. Pauza je
   schovaná přímo v klíčových snímcích: pohyb zabere prvních pár procent
   cyklu, zbytek prvek stojí — proto se nic nespouští ani nezastavuje a
   každý cyklus končí tam, kde začal. Délky jsou nesoudělné (9,2 / 10,4 /
   6,5 / 8,6 s), takže se čtyři ikony nikdy nesejdou do stejného rytmu:
   - klub — korunka se protočí kolem svislé osy jako mince (`uspCoin`),
     kroužek kolem ní stojí; proto je tahle ikona v HTML **inline SVG**
     (soubor `assets/usp/icon-club.svg` je pořád na disku, ale nepoužívá se),
   - výměna — šipky se otočí o 180°,
   - doručení — auto stojí a pohupuje se (`uspBob`), kolem něj ubíhá vzduch
     ve dvou plánech (`uspAir`): jedna čára vzadu světlejší a pomalejší,
     jedna vpředu tmavší a rychlejší,
   - průvodce — **pod** podprsenkou (2,3 px od kresby, ne přes ni) přejede
     míra široká přesně jako ikona (31,5 px, čára 1,5 px): natáhne se,
     cvaknou zarážky a zmizí (`uspMeasureLine` / `uspMeasureTicks`).

   **Hover**: podklad kruhu ztmavne na N200, mlha dostane
   `filter: contrast(1.22) brightness(1.03)` a pohyb se **přehraje hned**,
   aby se nečekalo na další kolo — kratší varianta téže animace
   (`uspCoinOnce` / `uspFlipOnce` 360°, u auta a míry jen zkrácený cyklus).
   Všechny končí v poloze, ve které ikona odpočívá, takže se po odjetí
   myši vrátí k pomalé smyčce bez skoku.

K tomu pořád platí: kruh ztmavne na N200 a povyroste na `--usp-badge-lift`,
ikona uvnitř na `--usp-icon-lift`.
Tohle nahradilo předchozí USP s 3D rendery a béžovým duotone filtrem; ty
obrázky zůstaly v `assets/usp/` (`usp-*.png`), ale nikde se nepoužívají.

**Scroll hint** (`scroll-hint.js`, node `344:3152`) — pilulka 40×64 (r999,
1,5px bílý okraj, pozadí černá 16 %) s bílou tečkou r4, která uvnitř sjíždí
o 24 px dolů a mizí. **48 px** nad spodní hranou hero, vodorovně na středu. Objeví se po 3,5 s
(nájezd 520 ms), šipka uvnitř pomalu pulzuje dolů, po scrollu nad 40 px mizí
a nahoře se zase vrátí. Klik odscrolluje tak, aby USP sekce začínala **těsně pod hlavičkou**
(`usp.top − var(--bar-height)`), ne jen na spodní hranu hero.

**Hover stavy** — odkazy v liště: linka 1px v barvě písma, 6 px pod textem
(stejná výška jako podtržení u „Hledat"). Ikony: podbarvení 12 % barvy písma,
nad tmavou fotkou 24 %. Menu: šipka vyjíždí u kategorií, podtržení v Typ/Styl,
ztmavený rámeček u čipů. Šipky carouselu: pilulka ztmavne, šipka se posune
o 2 px svým směrem.

## 6. Vědomé odchylky od Figmy

| Věc | Proč |
|---|---|
| Hero fotky mají `object-fit: cover` s vlastním zoomem místo přesné Figma transformace | Figma ořez je ruční pro 1920×1025; při jiných poměrech uřezával hlavu nebo nohy |
| Slide 1 má `--zoom: 1`, slide 2 `1.28` (Figma 1,12 a 1,377) | Aby modelky byly opticky stejně velké a bylo vidět chodidla |
| 3 tečky pagination místo 4 | Máme tři fotky |
| Přerušovaný rámeček kódu kupónu kreslí SVG maska | CSS `dashed` má u 2px čáry dvakrát delší čárky než Figma (4/4) |
| Šipka za „PODPRSENKY" chybí | Export z Figmy je prázdný soubor a ve Figmě taky není vidět |
| USP nechá pod ~1400 px zalomit delší popisky na dva řádky | Sloupce zůstávají čtyři, stejně jako v autolayoutu návrhu; velikosti se nemění |
| Text v tooltipu je „Všechny kupóny na jednom místě." místo „Zde najdete veškeré dostupné kupóny." | Kratší a bez „zde"; původní věta měla 276 z 277 dostupných px, cokoli delšího se zalomí |
| Tooltip se zavírá i scrollem nad 120 px | Je to pobídka na první pohled na stránku |
| Tooltip má velmi jemný stín, Figma žádný nemá | Aby karta držela hranu i mimo fotku (odsouhlaseno) |
| Scroll hint je přesně na středu | Figma ho má na `50% − 4px`, což vypadá na nechtěný posun |
| Overlay u drawru | Figma ho nemá, ale drží to systém s menu |
| Sloupec bannerů se pod 1920 zmenšuje poměrově, návrh má 400 px napevno | Při 1280 ukrajoval produktovým kartám skoro třetinu místa |
| Bannery mají r6 místo r8 z návrhu | Sjednoceno s produktovými kartami (zadáno) |
| Název produktu má dva řádky a pak tečky, návrh počítá s jedním | Delší názvy se jinak uřízly hned v polovině (zadáno) |
| Výchozí stav nemá řádek „Lidé často hledají" z návrhu | Zadáno — zůstává jen „Naposledy hledané" |
| Odkazy „Doporučené kategorie" a „Astratex magazín" jsou pod produkty, návrh je má nad nimi | Zadáno |
| Karty ve výsledcích mají názvy podle svých fotek, ne „Krajkové kalhotky Elizabeth" u všech pěti | V návrhu zůstal zástupný název na všech kartách, ale fotky jsou pět různých produktů |
| V pásku výsledků je šestá karta navíc (pět je v návrhu) | Aby pravá šipka měla kam posunout |
| Levá šipka u výsledků se objeví až po posunu, návrh ji kreslí rovnou | Stejné chování jako v pásku ve výchozím stavu |
| „Jak vyprat **krajkové** spodní prádlo" — v návrhu je překlep „kajkové" | Zjevná chyba v textu, ne záměr |
| Chip má obrys stínem `inset`, ne `border` | Figma kreslí obrys dovnitř, rámeček má 41 px; s `border` by měl 43 |
| Hero používá statický Google Sans místo Google Sans Flex | Flex není v systému ani veřejně na Google Fonts; řezy 600/400/500 sedí, šířky textů se můžou lišit o jednotky px |

Odchylky písma v řádu desetin pixelu jsou normální — prohlížeč sází text
trochu jinak než Figma. Pozice se obvykle shodují do 1 px.

## 7. Jak ověřovat

Náhledový panel je často skrytý a v tom stavu **prohlížeč zmrazí přechody
i `requestAnimationFrame`**. Čtení `getComputedStyle` pak vrací hodnoty
zaseknuté uprostřed animace. Proto:

- dojet přechody přes `element.getAnimations().forEach(a => a.finish())`,
- nebo vynutit vykreslení sérií screenshotů,
- časovače testovat s podvrženým `setTimeout`/`Date.now`,
- hover vynutit kopií skutečného `:hover` pravidla ze stylesheetu na třídu.

Souřadnice porovnávám s metadaty z Figmy přepočtenými na souřadnice stránky.

## 8. Otevřené věci

**Nasazení na VPS (rozpracované).** Hetzner `5.161.87.248` (`zecbit-vps`,
root). Server odpovídá na ping, ale porty 22/80/443 jsou zvenku zavřené —
firewall. Vygeneroval jsem klíč `~/.ssh/id_ed25519_zecbit` (soukromá část jen
na Macu) a `~/.ssh/config` na něj odkazuje. Instrukce pro uživatele jsou
v `/Users/jiricondl/Desktop/PROJEKTY/ASTRATEX/header/VPS.txt`: vložit veřejný
klíč, otevřít porty. Web má být **chráněný heslem** (basic auth), fonty se
nahrávají (rozhodnutí uživatele). Postup pak: rsync 19 MB → nginx/Caddy →
basic auth → ověřit zvenku.

**Drobnosti, o kterých uživatel ví a nechal je být:**
- při okně 1280 px a výšce do ~825 px má menu vlastní posuvník a pravý sloupec
  končí 45 px od karty místo 40,
- odkazy „Pro zákazníky" v menu nemají podtržení při hoveru (nebylo zadáno),
- tlačítka kupónů nemají hover ani funkci (nebylo zadáno),
- `prefers-reduced-motion` vypíná autoplay a zkracuje přechody na 1 ms.

## 8b. Typografie hero (node 342:2097, verze 2)

| Prvek | Hodnota |
|---|---|
| nadpis `342:2105` | 64 / 68 px, SemiBold 600, šířka 500 |
| podnadpis `342:2106` | 24 / 32 px, Regular 400 |
| tlačítko `342:2113` | 17 / 21 px, Medium 500, `#151515`, bez prostrkání |
| tlačítko pozadí `342:2112` | bílé v obou variantách (dřív průhledné černé na tmavé fotce) |
| text → tlačítko `360:8622` | 24 px (dřív 40) |
| (text + tlačítko) → pagination `342:2103` | 48 px (dřív 40) |

## 8b2. Hero — pagination a scroll hint (verze 3)

Pagination (`342:2116`) se přesunula z prostředka spodní lišty **do levého
sloupce pod tlačítko**, rozestup 40 px (stejný jako mezi textem a CTA). Sedí
pod `.hero__stack`, takže se při přepnutí slidu nehýbe. Scroll hint klesl
z 81 na 40 px nad spodní hranu hero.

Spodní hrana obsahu je tak jedna linka: tečky vlevo, šipky vpravo i pilulka
uprostřed končí 40 px nad hero. Texty i CTA se tím posunuly o 48 px nahoru
(8 px tečky + 40 px rozestup) — to je v návrhu taky.

## 8c. Hlavička (node 342:2153, verze 2)

| Prvek | Hodnota |
|---|---|
| lišta | 72 px (16 + řádek 40 + 16), vodorovně 32 |
| odkazy `342:2160–2163` | 19 / 23 px, Medium 500, rozestup 24, k „Výprodej" 6 |
| štítek `342:2165/2168` | špička 12 px, text 17 / 21 SemiBold, **bez verzálek** |
| ikony vpravo `342:2172` | 5 × 40 × 40, radius 10, ikona 24, rozestup 8, skupina 232 |
| pořadí | lupa → kupón → srdce → profil → košík |

**Hledání** se přesunulo zleva doprava a je z něj jen ikona (`342:2174`,
anotace „hledaní vpravo"). Tím zmizela celá `.search` (ikona + text „Hledat"
s podtržením) — v CSS po ní nezbylo nic.

Tmavá sada ikon je exportovaná na plátně 19,2 px (lupa 20 px), světlá na 24 px.
Obě mají `viewBox`, takže se škálují včetně tloušťky tahu a v 24 px vycházejí
stejně; nové exporty tmavé sady nebyly potřeba.

## 8d. Export zpět do Figmy (stránka „Web z kódu")

Hotová stránka je ve stejném souboru (`LAkfV5lfb3ASyFinSbpyYu`) na nové
stránce **„Web z kódu — 2026-10"**, rámec `429:2426`, 1920 × 2127.

Postaveno nástrojem `use_figma` z **druhého** Figma konektoru
(`plugin:figma:figma`, vzdálený server Figmy) — ten lokální z aplikace
umí jen číst. Konektor vyžaduje přihlášení přes `/mcp`.

Stavěno z publikované knihovny **Astratex Global Components**, ne
z nakreslených obdélníků:

| Co | Odkud |
|---|---|
| Logo, ikony hlavičky, ikony USP, šipka carouselu | komponenty z knihovny |
| velikosti písma a prokládání | textové styly `Google Sans/...` |
| barvy textů a ploch | proměnné `Neutral/N0 … N900` |
| ikonka kupónu | klon z původní hlavičky (není publikovaná zvlášť) |
| špička slevového štítku, křížek tooltipu | `createNodeFromSvg` z `assets/` |
| fotka hero | `upload_assets` (6 MB PNG) |

Všechny kontejnery mají autolayout (jediná výjimka je instance Loga).
Rozměry sedí s webem: hlavička 72 (16/32), hero 1080 s obsahem 961
(96/40/40), text → tlačítko 24, → pagination 48, USP 319 (py 80, gap 32,
sloupce 456), dlaždice 728 (64/40, gap 24), tooltip 341 × 78.

**Odchylka:** textové styly z knihovny jsou postavené na **Google Sans
Flex**, zatímco web používá klasický **Google Sans**. Velikosti i prokládání
jsou shodné, liší se jen řez rodiny. Přepsat font na kartě by znamenalo
odpojit text od knihovního stylu, takže jsem to nechal na knihovně.

## 9. Historie požadavků (pořadí)

1. Implementace hero + hlavička + USP + dlaždice z Figmy (1:1, 1920×1853)
2. Responzivita 2560 → 1400 → 1280, jen fotka se ořezává
3. USP vždy ve viewportu, odsazení 16 dole, 64 nad dlaždicemi
4. Carousel: druhý slide, ink theming, texty per slide, animace
5. Nájezd hlavičky při načtení, navázaný na načtení fotky
6. Sticky hlavička, bílé podbarvení po scrollu se zpožděním
7. Mega menu Dámské + hover stavy
8. Drawer kupónů + hover na křížku
9. Pořadí ikon, hover stavy, šipky carouselu
10. USP: Google Sans, ikony 24, výška 72
11. Varianta hero s odsazením, přepínaná logem
12. Hero v2 (node 342:2097): nová typografie, hero na plnou výšku viewportu,
    bílé CTA, šipka dolů jako scroll hint
13. Hlavička v2 (node 342:2153): větší písmo i ikony, lišta 88, hledání zleva
    pryč — je z něj ikona vpravo
14. Hero v3 (node 342:2097): pagination pod tlačítko, scroll hint níž
15. USP v2 (node 344:3105): 3D ikony, burgundy hover, šipka scrolluje na USP
16. Tooltip u kupónů (node 309:10328): popne se po načtení, ikonka drží hover
17. Úpravy v node 342:2095: hlavička 72, odsazení 24/48 v hero, scroll prvek
    40×64 s tečkou místo šipky
18. USP v3 (node 375:3177): kruhové ikony 72 px, nové texty, hover animace
19. Animace ikon v USP (nájezd, mlha, pohyb na hover) — moje, nezadané
20. Třetí slide v carouselu (node 296:9506) na druhé pozici; texty
    „Krajka, která padne / Sladěné sety podprsenek a kalhotek / Vybrat set"
    jsou moje, ve Figmě u té fotky žádné nebyly
21. Nasazení na GitHub Pages + export stránky zpět do Figmy
22. Vyhledávací panel (node 411:12701) s nájezdem zleva
23. Vyhledávání: stav s výsledky při psaní (node 442:3142)
24. Skutečné produkty ve vyhledávání: fotky + video na hover
25. Výsledky vyhledávání v2 (node 455:2556): dva řádky odkazů nahoře,
    skutečné fotky a videa i v této fázi, vyplněné bannery s hoverem
