# ForeverQR

Free QR code generator. Static QR codes that never expire: links, Google Forms, UPI, WhatsApp, WiFi and contact cards, with your colours and logo.

Live at https://foreverqr.github.io. Made by [Deepansh Deep](https://deepansh-deep.github.io).

## Editing

The page is one self-contained `index.html`, built from the parts in `src/`:

- `src/head.html`: page text, styles and SEO tags
- `src/app.config.js`: links, the sponsor and the "More from Deepansh" list
- `src/lib.js`: QR encoder (qrcode-generator by Kazuhiko Arase, MIT licence)

After editing, run `./build.sh` and commit `index.html`.
