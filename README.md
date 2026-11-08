# sloptools.github.io

The sloptools site: [pasteup](https://github.com/sloptools/pasteup) and [texxer](https://github.com/sloptools/texxer), with their docs rendered from each repo's `docs/`.

Fully static and self-hosted: fonts, images and scripts come from the site itself, nothing from a CDN, no cookies.

```sh
npm install
npm run serve     # builds from ../pasteup and ../texxer, serves on :8080
```

`.github/workflows/pages.yml` builds and publishes on every push, daily, by hand, and on a `repository_dispatch` of type `docs`.

Fonts: IBM Plex Mono and Permanent Marker, both under the SIL Open Font License (see `src/fonts/`).
