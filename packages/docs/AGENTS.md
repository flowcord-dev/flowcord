# @flowcord/docs — Agent Context

Docusaurus site for [flowcord.dev](https://flowcord.dev). Standard
Docusaurus conventions apply; nothing exotic.

- Content lives in `docs/`: `getting-started/`, `core-concepts/`,
  `components/`, `advanced/`, `api-reference/`, `examples/`, plus
  `introduction.md`.
- Run locally with `npm run docs:start` from the repo root.
- Deploys via `.github/workflows/deploy-docs.yml` on push to
  `master` — doc changes go live on merge.
- When core's public API or behavior changes, check whether a page
  here documents it; `packages/core/ARCHITECTURE.md` is the
  internals reference, this site is the user-facing one.
