# Contributing to FlowCord

Hey, thanks for wanting to contribute — it genuinely means a lot. This doc explains how the process works and, more importantly, *why* it's set up this way so it actually makes sense rather than just feeling like red tape.

---

## A bit of context

FlowCord has a roadmap, and features are designed to fit together in ways that aren't always obvious from the outside. The architecture has some specific invariants — things that need to hold true for everything to work cleanly — and a PR that cuts across those, or duplicates something already in progress, ends up being a net loss for everyone: you spend time building something that won't merge, and I spend time reviewing something I have to close. Nobody wants that.

The process below exists to catch those situations *before* code gets written, not after. One well-considered contribution is worth a lot more than ten that don't land.

---

## The process

```
1. Open an issue
      ↓
2. Discussion + maintainer review
      ↓
3. Issue labeled `feature: accepted` or `bug: confirmed`
      ↓
4. Open a PR that references the issue
```

**PRs opened without an approved issue are automatically closed.** Not personal at all — it's just a safeguard to protect your time as much as mine. If your PR gets caught by the automation, no harm done; get the issue approved and reopen it.

### For bug fixes

1. Open a [Bug Report](https://github.com/flowcord-dev/flowcord/issues/new?template=bug_report.yml)
2. A maintainer will reproduce it and apply `bug: confirmed`
3. Once confirmed, open a PR with `Closes #N` in the description

### For new features

1. Open a [Feature Request](https://github.com/flowcord-dev/flowcord/issues/new?template=feature_request.yml)
2. Describe the problem, your proposed solution, and any alternatives you considered
3. Discussion — including architecture — happens in the issue. If the approach needs adjusting to fit the existing design, that's the right place to work it out, before any code gets written
4. A maintainer applies `feature: accepted` and may sketch out the expected approach
5. Then go build it and open a PR referencing the issue

---

## Architecture

Before proposing or implementing anything non-trivial, it's worth reading [ARCHITECTURE.md](./packages/core/ARCHITECTURE.md). It covers the session lifecycle, rendering pipeline, navigation system, and state architecture — the stuff that new features need to play nicely with.

If your idea would touch core architecture, mention it explicitly in the issue. That conversation is part of the approval, not a surprise to save for the PR.

---

## On AI-assisted development

AI tools are totally fine to use. The bar for contributions doesn't change based on how the code got written though — it's still on you to understand what you're submitting.

If a reviewer asks why a particular design decision was made and the honest answer is "I'm not sure, the AI wrote it that way," the PR will be closed. That's not a knock on using AI — it's just that "I understand this code" is the baseline for any contribution, regardless of tooling.

In practice that means:
- Read through the full diff before opening a PR
- Verify any AI-generated code against the existing architecture yourself
- Be ready to talk through your decisions in review

The PR template has two AI-related checkboxes: one for disclosing that you used AI tools (zero judgment), and one attesting that you understand the code you're submitting. Fill them out honestly.

---

## Code standards

- **TypeScript**: Strict mode. No `any` without a good reason.
- **Tests**: New behavior needs tests. FlowCord has an in-house interaction simulator — use it. Existing tests are the best guide for patterns.
- **Style**: Match the conventions in whatever file you're editing. Don't reformat unrelated code.
- **Commits**: Write commit messages that explain *why*, not just what.

---

## AI context files

The repo ships context for coding agents: a root [`AGENTS.md`](./AGENTS.md) (with a `CLAUDE.md` shim), an `AGENTS.md` in each package, and skills under `.claude/skills/`. They describe the conventions in this document plus repo structure and commands — if your PR changes a command, convention, or structure they mention, update the relevant file in the same PR.

---

## What gets auto-closed

- PRs with no linked issue
- PRs where the linked issue doesn't have `bug: confirmed` or `feature: accepted`
- PRs implementing something not on the roadmap or not yet approved

If your PR was auto-closed and you think it shouldn't have been, drop a comment on the linked issue.

---

## Not sure if your idea fits?

Come ask in [Discord](https://discord.gg/tcTqa5aKh9) before filing an issue. It's a much lower-friction way to gut-check an idea, and way faster than going back and forth in an issue thread.
