# axelriosg.github.io

## Cursor Cloud specific instructions

This repo is a **zero-dependency static website** (a personal site deployed via GitHub Pages, custom domain in `CNAME`). There is no package manager, build step, backend, or database — pages are plain HTML/CSS/vanilla JS served as-is.

### Running locally (dev)

Serve the repo root with any static file server, e.g. from `/workspace`:

```
python3 -m http.server 8000
```

Then open `http://localhost:8000/index.html`. Pages: `index.html`, `brain.html`, `latenscracia.html`, `chihuahua.html`.

### Build / lint / test

None are configured (no `package.json`, `Makefile`, linter, or test runner). "Deploy" happens automatically when `main` is pushed (GitHub Pages).

### Non-obvious notes

- The Chihuahua Generator (`chihuahua.html` + `js/chichi.js`) fetches images from the public `https://dog.ceo` API, so that specific feature needs outbound internet. Core page content renders without it.
- Styling/icons load from CDNs (Bootstrap via jsDelivr, Ionicons via unpkg, Google Fonts). Without internet the layout still renders using the vendored `css/bootstrap.css` + `css/style.css`, but Ionicon social glyphs won't appear.
- `python3 -m http.server` does not hot-reload — just re-request the page after editing.
