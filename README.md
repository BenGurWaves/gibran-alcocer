# Gibran Alcocer — *El Aire*

A preview brand site for **Gibran Alcocer**, Mexican pianist and composer (Mérida, Yucatán). Rendered as the *air between two notes* — five held tableaux traversed by a single, physically-simulated string that responds to the cursor as a piano hammer.

## Stack
- Static HTML / CSS / vanilla JS — no framework, no build step.
- Single typeface — *Cormorant Garamond* (Google Fonts).
- Wave-equation simulation for the string (180 segments · spring + damping + neighbour coupling).
- Yucatán Nocturno palette: Noche `#0A0908`, Marfil `#E8DEC9`, Henequén `#C9A36B`, Jacaranda `#3E2A4A`.

## Local
```sh
python3 -m http.server 8201
# http://localhost:8201
```

## Deploy (Cloudflare Pages)
```sh
wrangler pages deploy . --project-name=gibran-alcocer --branch=main
```

> Compuesto en La Mérida, en *Do menor*. Tipografía: *Cormorant Garamond*. Sin asistente, sin teclado virtual. © MMXXVI.
