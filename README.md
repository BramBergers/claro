# Claro, website (clarodesign.nl)

Een snelle, statische website met een CMS (Sanity), gehost op Netlify. Geen eigen server, geen database om te beheren.

```
src/content/content.json   teksten en diensten (terugval zolang Sanity niet is gekoppeld)
src/assets/logo.svg        jouw logo
src/assets/klant-*.svg     klantlogo's (placeholder)
src/styles/main.css        alle kleuren, maten en effecten
src/scripts/main.js        lamp-cursor, scroll-effecten, menu, overgangen
scripts/lib/templates.mjs  de opbouw van alle pagina's
public/media/              video's en beelden
public/fonts/              (optioneel) eigen lettertypebestand
studio/                    het Sanity-CMS
```

## 1. Online zetten (eenmalig)

1. **GitHub:** maak een nieuwe repository (bijv. `clarodesign`) en upload alle bestanden uit deze map (*Add file → Upload files*). Upload de map `dist` en `node_modules` niet, die hoeven niet.
2. **Netlify:** *Add new site → Import an existing project* → kies je GitHub-repository. Netlify leest de instellingen zelf uit `netlify.toml`. Klik op *Deploy*.
3. **Domein koppelen:** in Netlify: *Domain management → Add a domain* → `clarodesign.nl`. Netlify toont dan precies welke DNS-records je nodig hebt. Zet die bij Vimexx onder *DNS-beheer*. Meestal is dat:
   - een **A-record** voor `clarodesign.nl` naar het IP-adres dat Netlify noemt (op dit moment `75.2.60.5`),
   - een **CNAME** voor `www` naar `jouwsite.netlify.app`.
   Gebruik altijd de waarden die Netlify zelf laat zien. Het kan een paar uur duren voordat het werkt. Het SSL-slotje (https) regelt Netlify automatisch.
4. **Contactformulier:** reacties komen binnen in Netlify onder *Forms*. Stel daar onder *Form notifications* in dat je een e-mail krijgt bij elk bericht.

Elke keer dat je iets in GitHub aanpast, bouwt Netlify de site vanzelf opnieuw.

## 2. CMS koppelen (Sanity), wanneer je zover bent

Zonder Sanity werkt de site gewoon met `content.json`. Met Sanity pas je teksten, diensten, cases, klantlogo's en pagina's aan in een eigen beheeromgeving.

1. Maak op [sanity.io/manage](https://www.sanity.io/manage) een nieuw project (dataset: `production`) en noteer het **projectId**.
2. Zet dat projectId op twee plekken in `studio/`: `sanity.config.js` en `sanity.cli.js` (zoek op `VUL_HIER_JE_PROJECT_ID_IN`).
3. Open de map `studio/` in een terminal: `npm install`, dan `npx sanity deploy`. Je krijgt een webadres waar je inlogt om inhoud te beheren.
4. In Netlify: *Site configuration → Environment variables* → voeg toe `SANITY_PROJECT_ID` (jouw projectId) en eventueel `SANITY_DATASET` (standaard `production`).
5. Laat de site automatisch updaten als je op *Publish* klikt: Netlify → *Build hooks* → maak een hook. Sanity (sanity.io/manage → API → Webhooks) → nieuwe webhook met die URL.

Gaat er bij het ophalen uit Sanity iets mis, dan mislukt de build bewust. Netlify laat dan de vorige werkende versie online staan.

## 3. Veelgebruikte aanpassingen

**Logo vervangen:** vervang `src/assets/logo.svg`. Geef in je SVG de laag van de punt de naam `dot` (Figma: laagnaam `dot` en bij het exporteren *Include "id" attribute* aanvinken). De punt krijgt dan de accentkleur, de rest wordt wit in het menu en donkerpaars in de footer. De animatie in het menu loopt automatisch over alle letters van links naar rechts.

**Klantlogo's:** upload een **SVG** (wit is prima). De site maakt er automatisch lichtpaars van. In Sanity: *Klanten → nieuw*. Zonder Sanity: bestand in `src/assets/` zetten en toevoegen in `content.json` onder `clients`.

**Diensten toevoegen:** in Sanity *Diensten → nieuw*, of in `content.json` een blok kopiëren onder `services`. De lijst op de homepage, de dropdown, het mobiele menu en de dienstpagina maken zich vanzelf aan.

**Beelden en video's** (MP4, PNG, JPG, WebP): houd video's klein, liefst onder 8 MB (1280 px breed is genoeg voor de voorbeelden, 1920 px voor de header-video, zonder geluid). Zware video's maken de site traag. Voorbeeld met ffmpeg:
`ffmpeg -i origineel.mp4 -an -vf scale=1920:-2 -c:v libx264 -crf 27 -movflags +faststart klein.mp4`

**Kleuren en maten:** bovenaan `src/styles/main.css`.

**Lettertype (Unbounded):** staat nu via Google Fonts. Voor privacy en snelheid is het beter om het bestand zelf te hosten: download Unbounded (variabel, woff2) en zet het als `public/fonts/Unbounded.woff2`. De site gebruikt dan automatisch dat bestand en laadt niets meer van Google.

## 4. Lokaal bekijken (optioneel)

Je hebt alleen [Node.js](https://nodejs.org) nodig (versie 20 of nieuwer), geen installatie van pakketten.

```
node scripts/dev.mjs      → open http://localhost:4321
node scripts/build.mjs    → bouwt de site in de map dist
```

## 5. Nog in te vullen voor de lancering

- LinkedIn-link (staat nu op `https://www.linkedin.com/`), e-mailadres (`hallo@clarodesign.nl` is een voorbeeld) en het echte KvK-nummer. Allemaal in `content.json` of Sanity → *Website-instellingen*.
- Alle teksten van de dienstpagina's, Over Claro en de cases zijn voorbeeldtekst.
- De privacyverklaring (`/privacy/`) is een concept. Laat die controleren.
