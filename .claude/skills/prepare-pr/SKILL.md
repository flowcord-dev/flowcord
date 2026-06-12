---
name: prepare-pr
description: Use when preparing, opening, or describing a pull request for FlowCord, or when asked about the contribution workflow, issue approval, or why a PR was auto-closed.
---

# Preparing a FlowCord pull request

FlowCord enforces an issue-first workflow with automation
(`.github/workflows/pr-gate.yml`). A PR that skips these steps is
closed by a bot, wasting everyone's time. Follow them in order.

## 1. Verify the approved issue — before anything else

The PR must reference an issue labeled `feature: accepted` (for
features) or `bug: confirmed` (for bug fixes).

- If no such issue exists: **STOP. Do not open a PR.** Tell the
  user the work needs an approved issue first (see
  [CONTRIBUTING.md](../../../CONTRIBUTING.md) for the process) and
  offer to draft the issue instead.
- If the issue exists but lacks the label, the PR will be
  auto-closed — same answer: stop and say so.

## 2. Pre-flight checks

From the repo root, all of these must pass:

```bash
npm run typecheck && npm run lint && npm run test && npm run sync:check
```

Fix failures before proceeding. Do not open a PR with known-red
checks.

## 3. Commit messages

Explain *why*, not just what — per CONTRIBUTING.md that's the
rule. No format is enforced, but recent history commonly uses
conventional-style prefixes (`fix(ci): …`, `docs: …`); match that
style, and put the reasoning in the body when the summary line
can't carry it.

## 4. PR body

Follow `.github/pull_request_template.md` exactly. Hard
requirements:

- The body **text** must contain a closing keyword for the
  approved issue, e.g. `Closes #123`. Linking via the GitHub
  sidebar does not satisfy the gate.
- Fill in "What changed and why" (reasoning, not a line-by-line
  diff narration) and "Test coverage".

See [pr-body-template.md](./pr-body-template.md) for a filled-in
example.

## 5. The checklist is the human's, not yours

The template's checkboxes — especially the two AI-disclosure
items — are personal attestations by the human contributor.
Leave all checkboxes unchecked, and remind the user to read the
diff and complete the checklist themselves before marking the PR
ready for review.
