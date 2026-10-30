# Regntid / Regnrytme – Bergen

Nedbøroversikt med våt- og tørrekorder, års- og månedstall og historiske mønstre.

## Kjøring og publisering

- Netlify: `node scripts/build-netlify.mjs` lager de statiske filene. `netlify.toml` angir byggekommando, publiseringsmappe og serverfunksjon.
- Sites: `node scripts/build.mjs` lager Cloudflare Worker med de samme sidefilene.
- Lokal forhåndsvisning: bygg Sites-versjonen og kjør `node scripts/preview.mjs`.
- `FROST_CLIENT_ID` konfigureres som servermiljøvariabel hos hostingtjenesten, aldri i kildekoden. `/api/recent-rain` henter årets målinger fra MET Frost ved åpning eller manuell oppdatering.

Historikk følger med som JavaScript-datafiler; nettstedet bruker ingen lokal database. `scripts/prerender-records.mjs` legger lagrede våt- og tørrekorder direkte i HTML. Nettleseren oppdaterer dem når nye Frost-målinger kommer inn.

## Tørrekorder

Årets tørreste døgn, komplette måned, komplette ISO-uke og rullerende sjudøgnsperiode vises separat. Kalenderdatoer, måneder og ukenummer sammenlignes med samme periode i tidligere år. Pågående måneder og uker kan ikke kåres som nye tørrekorder. Årsrekorden kåres først etter hele året; årets sum vises både mot tørreste komplette år og mot tidligere år ved samme dato.

0 mm kan tangeres, men ikke slås. Lengste rekke under 1 mm og færrest regndager i året har egne sammenligninger. Under 1 mm er ikke nødvendigvis helt regnfritt. Manglende målinger blir aldri satt til null. Måned og år bruker den sammensatte serien fra 1890; døgn, uker og rekker bruker Frost fra 1983. Dette er rekorder i prosjektets datagrunnlag, ikke en offisiell rekordliste for hele Bergen.

## Kontroll

`node --test tests/*.cjs tests/*.mjs`

## Siste tre måledøgn

De tre siste kalenderdatoene til siste tilgjengelige måledøgn vises øverst, nyeste først. Datoer uten måling merkes tydelig og blir aldri 0 mm. Nye Frost-data hentes uten mellomlager ved åpning, ved gjenoppretting fra nettleserhistorikken og via oppdateringsknappen. Ved kildefeil beholdes en datert, synlig snapshot. Datoen er døgnets slutt kl. 06 UTC.


## City selection

The default city is Bergen. `?city=oslo` loads Oslo–Blindern (Frost SN18700, NOAA GHCN-Daily NOM00001492) before any model initializes. Changing city reloads the page, preserving its section, so models and outstanding live requests cannot mix stations. The API validates a two-city allowlist and the client rejects responses for a different station.

Oslo history was downloaded 2026-10-28 from https://www.ncei.noaa.gov/pub/data/ghcn/daily/all/NOM00001492.dly. `scripts/import-oslo.py` reproduces the assets from the raw file in the parent workspace. It accepts PRCP with no quality flag and nonnegative values, requires all days for monthly totals, and omits the current month. The saved snapshot has 1,075 complete months (1937-03 through 2026-09), all 360 normal months in 1991–2020, and daily observations through 2026-10-24. Future months and missing values are not zero-filled. Current-year Frost data supersedes that year only after a response from the correct station. Site credentials remain server-side.

## Stavanger–Våland

`?city=stavanger` selects SN44640 (NOAA NOE00110590), coordinates 58.9569, 5.7300. Imported on 2026-10-29 using `scripts/import-stavanger.py`: NOAA archive supplemented with approved MET Frost observations for 1938–2025, and all of 2026 from Frost. Raw files remain in the parent workspace's `data/raw/stavanger-*`. No other station is used. There are 865 complete months, 1938-01 through 2026-09, and daily observations through 2026-10-29. Only 203 of the 360 normal-period months are complete, so full fixed normals, corresponding anomalies and the current forecast are unavailable. Missing data is never zero-filled; annual/monthly actuals, complete seasons and records remain available. The temporary history retrieval endpoint used during import is removed from the final worker. Published initial HTML uses a separate Stavanger record snapshot, as for Oslo.

## Trondheim* – sammensatt serie

`?city=trondheim` uses the Voll station for live MET Frost data (SN68860). The historical NOAA GHCN-Daily series uses NOE00134634 (Leinstrand) for **1991-01-01 through 2001-12-31**, and NOE00111040 (Trondheim–Voll) outside that interval. Earlier Voll data from 1923 retain their gaps. No day is estimated or zero-filled; the station switch is fixed and documented in `daily.sourcePeriods`. The CSV source column identifies the station per month.

Imported 2026-10-30 using `scripts/import-trondheim.py`, from raw `../data/raw/trondheim-voll.dly` and `../data/raw/leinstrand.dly`. Download from `https://www.ncei.noaa.gov/pub/data/ghcn/daily/all/<archive>.dly`. Only nonnegative PRCP with empty quality flag and without multi-day accumulation flag A are accepted. The resulting asset has 951 complete months, all 360 normal months and all 10,958 normal-period days. Normal precipitation is 875.4567 mm/year and rain days (>=1 mm) average 147.9333/year over 1991–2020. These are descriptive averages from the composite, not official Voll normals or a homogenized climate series. Comparisons continue to use complete normal-period years shared by the selected cities.

During the overlapping approved dates in 2002–2020, Leinstrand precipitation totals are 0.63% above Voll, with about seven fewer rain days per year. This helps assess the station switch but does not remove local differences. The visible asterisk explains the change for annual values, records, history and city comparisons. Available fixed normals also enable the existing experimental forecast; station changes may affect historical patterns.

GitHub `meimaimai2025/regntid` is the shared source for the Mac checkout. Sites hosting has a separate source repository; changes must be transferred explicitly, with GitHub changes checked before each transfer. This is not automatic two-way synchronization.

## Velg byer i sammenligningen

Sammenligningen starter med valgt hovedby, Oslo, Bergen og Stavanger-området, uten duplikater. Alle kan fjernes eller legges til med avkryssing; søk filtrerer bare listen. Referansebyen er først hovedbyen og kan deretter velges blant de avkryssede byene. Fjernes referansebyen, brukes første gjenværende by. Tomt utvalg viser en veiledning. Standardknappen gjenoppretter utvalget for hovedbyen. Valget nullstilles ved side-/bybytte.

Kun avkryssede byer inngår i felles datoer, normalperiodens komplette år og Frost-oppdateringer. Inaktive byer begrenser derfor ikke datadekningen. Statisk historikk er fortsatt lastet som før. Bylisten kommer fra `RAIN_CITIES` og `RAIN_CITY_DATA` i `city-data.js`. Tester dekker 100 tilgjengelige byer, standardvalg, avkryssing, søk, referanseby og tomt utvalg.
