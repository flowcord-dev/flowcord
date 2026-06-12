# FlowCord — Agent Context

FlowCord is a lifecycle-driven interactive menu framework for
Discord.js (v14): declarative menus with sessions, navigation,
state, and behavior policies. TypeScript Nx monorepo using npm
workspaces; Node >= 18.

## Repo map

| Package                     | npm name                    | What it is                                                       |
| --------------------------- | --------------------------- | ---------------------------------------------------------------- |
| `packages/core`             | `@flowcord/core`            | The framework (~11k LOC). Engine, menus, navigation, state.      |
| `packages/testing`          | `@flowcord/testing`         | Headless test harness (`MenuHarness`) for driving menus.         |
| `packages/core-integration` | `@flowcord/core-integration`| Private. Behavior tests for core, written with the harness.      |
| `packages/docs`             | `@flowcord/docs`            | Docusaurus site for flowcord.dev.                                |

**Each package has its own `AGENTS.md` — read it before working
in that package.** It carries package-specific context and points
to the depth docs for that package's domains.

Versioning is owned by `nx release`; `@flowcord/core` and
`@flowcord/testing` are released in lockstep (testing pins core as
an exact-version peer dep). Never hand-edit `version` fields or
the peer-dep pin.

## Commands

Run from the repo root:

| Command                  | Purpose                                  |
| ------------------------ | ---------------------------------------- |
| `npm run build`          | Build all packages (Nx)                  |
| `npm run typecheck`      | Typecheck all packages                   |
| `npm run test`           | Run all test suites                      |
| `npm run test:coverage`  | Tests with coverage                      |
| `npm run lint`           | Lint all packages                        |
| `npm run sync:check`     | Verify Nx workspace sync state           |
| `npm run docs:start`     | Run the docs site locally                |

Single package: `npx nx <target> <project>`, e.g.
`npx nx test core-integration`.

**Definition of done:** `typecheck`, `lint`, and `test` all pass
before any commit you intend to put in a PR.

## Code conventions (all packages)

- TypeScript strict mode. No `any` without a good reason.
- Prettier via root `.prettierrc.json` — note the unusual
  **70-char print width** and single quotes.
- Match the conventions of the file you are editing. Never
  reformat unrelated code.
- New behavior requires tests. Unit tests colocate at
  `src/**/__tests__/*.test.ts`; behavior tests live in
  `packages/core-integration` and use `MenuHarness`.

## Contribution flow (hard gates)

Full rules: [CONTRIBUTING.md](./CONTRIBUTING.md). The parts that
are mechanically enforced (`.github/workflows/pr-gate.yml`
auto-closes violations):

- A PR must reference an issue labeled `feature: accepted` or
  `bug: confirmed`. **No approved issue → the PR is auto-closed.**
  Never open a PR for unapproved work; get the issue approved
  first.
- The PR body text must contain a closing keyword, e.g.
  `Closes #123`. Linking via the GitHub sidebar is not sufficient.
- Commit messages explain *why*, not just what — that's the only
  enforced rule. Recent history commonly uses conventional-style
  prefixes (`fix(ci): …`, `docs: …`); match that style, but the
  *why* in the message is what matters.
- The PR template has two AI-disclosure checkboxes. They are
  attestations by the human contributor — surface them and leave
  them for the human to check; never check them yourself.

When preparing a PR, use the `prepare-pr` skill
(`.claude/skills/prepare-pr/`) if your tooling supports skills.

## Maintenance

These AGENTS.md files state repo facts; depth lives in the linked
human docs. If a PR changes a command, convention, or structure
described here or in a package AGENTS.md, update that file in the
same PR.
