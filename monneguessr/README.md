# MonneGuessr 🌍

Et gratis GeoGuessr-inspireret spil til personlig brug med venner.

## Kom i gang

### 1. Host på GitHub Pages
1. Opret et nyt repository på GitHub kaldet `monneguessr`
2. Upload alle filerne
3. Gå til **Settings → Pages → Source: main branch**
4. Din URL bliver: `https://DITBRUGERNAVN.github.io/monneguessr`

### 2. Opret Mapillary API-nøgle
1. Gå til [mapillary.com/developer](https://www.mapillary.com/developer)
2. Opret en konto
3. Lav en ny app — brug din GitHub Pages URL som callback URL
4. Kopiér din **Client Access Token**

### 3. Spil!
1. Åbn din GitHub Pages URL
2. Indtast din Mapillary API-nøgle
3. Vælg mode og start spillet

## Game modes
- **Normal** — bevæg dig frit rundt
- **No Move** — du kan ikke bevæge dig, kun kigge rundt
- **NMPZ** — No Move, No Pan, No Zoom

## Kort
- **Verden** — lokationer fra hele verden
- **Europa** — kun europæiske lokationer  
- **Danmark** — kun danske byer

## Funktioner
- Solo, 1v1 og 2v2 modes
- Justerbar timer (30-300 sekunder)
- Helbreds-system
- Lydeffekter til/fra
- Justerbar UI størrelse
- Respawn-knap (tilbage til start)
- Resultatskærm med kort og afstand

## Teknologi
- [Mapillary JS](https://mapillary.github.io/mapillary-js/) — Street View billeder (gratis)
- [Leaflet](https://leafletjs.com/) — interaktivt gæt-kort (gratis)
- [OpenStreetMap](https://www.openstreetmap.org/) — kortdata (gratis)
