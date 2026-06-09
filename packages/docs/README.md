# @flowcord/docs

Documentation site for [FlowCord](https://flowcord.dev), built with [Docusaurus](https://docusaurus.io/).

## Development

Run from the **monorepo root**:

```bash
npm run docs:start        # start local dev server
npm run build -w @flowcord/docs   # production build
```

The dev server is available at `http://localhost:3000` and hot-reloads on content changes.

## Deployment

Deployments are handled automatically by `.github/workflows/deploy-docs.yml` on every push to `master` that touches `packages/docs/`. The workflow builds the site and publishes the `packages/docs/build` artifact to GitHub Pages at [flowcord.dev](https://flowcord.dev).

You can also trigger a deploy manually via **Actions → Deploy Docs to GitHub Pages → Run workflow**.

## Notes

- `static/CNAME` ensures the `flowcord.dev` custom domain is preserved in every build output.
- This package is private and never published to npm.
- Docs are intentionally excluded from `nx run-many` build/typecheck targets — the deploy workflow is the sole CI hook.
