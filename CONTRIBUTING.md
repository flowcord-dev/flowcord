# Contributing to FlowCord

Thanks for your interest in contributing. This document explains how contributions work and why the process is structured the way it is.

---

## Philosophy

FlowCord has a roadmap. Features are designed to work together, fit the existing architecture, and handle edge cases that aren't always obvious from the outside. A PR that implements a feature in a way that doesn't extend cleanly, or that duplicates work already in progress, is a net negative for everyone involved — the contributor wastes time building something that won't merge, and the maintainer wastes time reviewing it.

**Quality over quantity.** One well-considered PR is worth more than ten that need to be closed.

---

## The Process

```
1. Open an issue
      ↓
2. Discussion + maintainer review
      ↓
3. Issue labeled `feature: accepted` or `bug: confirmed`
      ↓
4. Open a PR that references the issue
```

**PRs opened without a corresponding approved issue are automatically closed.** This isn't personal — it's a prerequisite. The automation is there so neither of us wastes time.

### For bug fixes

1. Open a [Bug Report](https://github.com/flowcord-dev/flowcord-core/issues/new?template=bug_report.yml)
2. A maintainer will reproduce the issue and apply `bug: confirmed`
3. Once confirmed, open a PR referencing the issue with `Closes #N` in the description

### For new features

1. Open a [Feature Request](https://github.com/flowcord-dev/flowcord-core/issues/new?template=feature_request.yml)
2. Describe the problem, your proposed solution, and alternatives you considered
3. Discussion happens in the issue — **including architecture**. If your proposed approach doesn't fit the existing design, that conversation needs to happen before you write any code
4. A maintainer applies `feature: accepted` and may outline the expected approach
5. Once accepted, open a PR referencing the issue

---

## Architecture

Before proposing or implementing anything non-trivial, read [ARCHITECTURE.md](./ARCHITECTURE.md). FlowCord's session lifecycle, rendering pipeline, navigation system, and state architecture have specific invariants that new code must respect.

If your feature would require changes to core architecture, say so explicitly in the issue. That discussion is part of the approval process, not something to figure out mid-implementation.

---

## On AI-Assisted Development

AI tools are not banned. But the bar for contribution doesn't change based on how you wrote the code.

**You are responsible for every line you submit.** If a reviewer asks why you made an architectural decision and you can't answer, the PR will be closed. "The AI suggested it" is not an explanation.

Practically, this means:
- Don't submit code you don't understand
- Read through the full diff before opening a PR
- If you used AI to generate an implementation, verify it against the existing architecture yourself before submitting
- Reviewers will ask questions. Be prepared to answer them

The PR template includes two AI-related checkboxes: one for disclosing use of AI tools (no judgment), and one attesting that you understand the code you're submitting. Both are expected to be filled out honestly.

---

## Code Standards

- **TypeScript**: Strict mode. No `any` without justification.
- **Tests**: New behavior requires tests. FlowCord has an in-house interaction simulator — use it. Look at existing tests for patterns.
- **Style**: Follow the existing conventions in the file you're editing. Don't reformat unrelated code.
- **Commits**: Write a clear commit message that describes *why* the change was made, not just what it does.

---

## What Gets Auto-Closed

- PRs with no linked issue
- PRs where the linked issue doesn't have `bug: confirmed` or `feature: accepted`
- PRs that implement a feature not on the roadmap or not yet approved

If your PR was auto-closed and you think it was in error, comment on the linked issue.

---

## Questions?

If you're unsure whether an idea fits, ask in [Discord](https://discord.gg/tcTqa5aKh9) before filing an issue. It's faster and lower friction for everyone.
