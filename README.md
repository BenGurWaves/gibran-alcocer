# Gibran Alcocer — A film at the piano.

A preview brand site for **Gibran Alcocer**, Mexican pianist and composer (Mérida, Yucatán). Built around a 13-second loop of the composer at the piano, in five quiet movements: cinema, prelude, quote, the released *Idea* series, end.

## Stack
- Static HTML / CSS / vanilla JS — no framework, no build step.
- Single typeface — *Instrument Serif* (Roman + Italic).
- Two colours — `#0A0908` Noche, `#F2EBE0` Crema.
- Hero film transcoded to web-optimized H.264 (1080p · 2.1 MB; 720p · 866 KB for mobile) with poster frame.

## Local
```sh
python3 -m http.server 8201
# http://localhost:8201
```

## Deploy (Cloudflare Pages)
```sh
wrangler pages deploy . --project-name=gibran-alcocer --branch=main
```

> Gibran Alcocer · Mérida, Yucatán · MMXXVI. Set in *Instrument Serif*. Film recorded at home, twenty-three seconds, looped.
