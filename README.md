# FlowCord

Monorepo for **FlowCord** — a lifecycle-driven interactive menu framework for Discord.js.

## Packages

| Package | Path | Description |
|---|---|---|
| [`@flowcord/core`](packages/core) | `packages/core` | The core menu framework (published to npm). |

> More packages (`@flowcord/testing`, docs site) land in upcoming Phase 0 work.

## Repo layout

This is an [Nx](https://nx.dev) monorepo using npm workspaces. Each publishable package lives under
`packages/*`. Shared TypeScript compiler options live in [`tsconfig.base.json`](tsconfig.base.json).

## Common tasks

Run from the repo root:

```bash
npm install              # install all workspace dependencies (single root lockfile)

npx nx run-many -t build      # build every package
npx nx run-many -t test       # run all tests
npx nx run-many -t typecheck  # typecheck all packages
npx nx run-many -t lint       # lint all packages

npx nx build core             # build a single project
npx nx test core              # test a single project
```

Nx caches task results — re-running an unchanged target replays from cache.

## Releasing

Versioning, changelog, and publishing are handled by [`nx release`](https://nx.dev/features/manage-releases).
See [`packages/core`](packages/core) for package-specific details.

## License

Apache-2.0 — see [LICENSE](LICENSE).
