# Website

This website is built using [Docusaurus](https://docusaurus.io/), a modern static website generator.

## Installation

```bash
npm install
```

## Local Development

```bash
npm run start
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

## Build

```bash
npm run build
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.

## Deployment

This site is configured to deploy to the custom root domain `https://flowcord.dev/`.
Deployments are handled by GitHub Actions from pushes to `master`.
The workflow builds the site and publishes the `build` artifact to GitHub Pages.

### Triggering deployment

1. Merge your changes into `master`.
2. The workflow in `.github/workflows/deploy-pages.yml` runs automatically.
3. GitHub Pages serves the new build when the workflow completes.

### Notes

- `static/CNAME` is committed so the custom domain is preserved in each build.
- You can still run `npm run build` locally to verify output before merging.
