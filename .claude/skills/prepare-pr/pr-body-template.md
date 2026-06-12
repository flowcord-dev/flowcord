# Example PR body

A filled-in example of `.github/pull_request_template.md`. Match
this structure; replace the content.

```markdown
## Linked issue

Closes #42

## What changed and why

`MenuRenderer` rebuilt the full component tree on every render,
including menus whose state hadn't changed, which showed up as
visible latency on large paginated menus. This adds a render-hash
short-circuit at the instance level rather than caching inside
the renderer, because the instance already owns the state that
determines render output — caching lower down would have
duplicated that knowledge.

## Test coverage

Added behavior tests in
`packages/core-integration/src/__tests__/pagination.test.ts`
covering the unchanged-state short-circuit and a state mutation
that must invalidate it. Existing rendering unit tests cover the
hash computation.

## Checklist

- [ ] I have read [CONTRIBUTING.md](../CONTRIBUTING.md)
- [ ] This PR references an issue with the appropriate approval label (`bug: confirmed` or `feature: accepted`)
- [ ] Tests are unneeded, included, or existing tests cover this change
- [ ] I used AI assistance to write some or all of this code
- [ ] I have read every line of this PR and can independently explain each architectural decision without AI assistance
```

Note: checkboxes are intentionally left unchecked — they are the
human contributor's attestations.
