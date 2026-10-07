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

`node --test tests/calendar-records.test.cjs tests/dry-records.test.cjs tests/frost.test.mjs`
