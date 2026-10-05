---
name: land
description: >-
  Land requested changes in goncalvesjoao/gensai through reviewed, verified
  GitHub pull requests. Invoke only when the user explicitly requests landing,
  including /land; not for review, preparation, passing checks, or installation.
disable-model-invocation: true
metadata:
  delta-action: land
---

# Land

An explicit invocation supplies permission to carry out this workflow, including
publishing the change and merging its pull request. Proceed without asking for
the same permission again. Stop for genuine blockers or unresolved scope.

## Prepare

1. Read applicable repository instructions and contribution policies. Read
   `docs/agents/domain.md` and its required domain references; before reading
   linked issues, read `docs/agents/issue-tracker.md`.
2. Inspect status, branches, remotes, existing pull requests, and the requested
   change. Establish the exact files and commits in scope. Preserve unrelated
   staged, unstaged, and untracked work; ask only if scope cannot be determined.
   Stage explicit paths or hunks rather than the entire checkout.
3. Confirm `origin` points to `https://github.com/goncalvesjoao/gensai.git`
   (or its equivalent SSH URL) and GitHub authentication works. Publish only
   through that source remote, never through `local`. Stop on a different
   repository or unavailable authentication.
4. Fetch `origin` and confirm the intended target is `main`, the repository's
   default branch. If that has changed, resolve the destination before proceeding.
   Inspect current branch protection, rulesets, merge methods, CI definitions,
   submission templates, and contribution requirements. Honor applicable signing,
   agreements, human-authored text, documentation, changelog, and review
   obligations. Obtain required human-authored material rather than substituting
   generated text. Do not invent requirements absent from policy.
5. Create a dedicated, unused feature branch, or reuse the change's existing
   feature branch and matching pull request. Include the requested uncommitted
   changes in non-interactive commits. Preserve any configured signing; prefix
   editor-capable Git commands with `GIT_EDITOR=true`. Avoid force-pushes,
   destructive resets, and rewriting shared history. Use a merge of the latest
   target into the feature branch when synchronization is needed.
6. Pin the fetched target commit SHA as the review fixed point. Record the
   originating issue or spec and the acceptance criteria for this request.
   Follow the repository's issue workflow for actual tickets rather than
   creating a ticket merely to land changes.

## Review and implement findings

Load and run the existing `code-review` skill with the pinned target SHA and
the originating spec source. Delegate the Standards and Spec review procedure
to that skill; do not replace it with an informal review or duplicate its
implementation here.

The review must cover every change being landed, including preparation and
conflict-resolution edits. Commit those changes before review because
`code-review` compares committed changes against `HEAD`. If there is no issue
or spec file, follow that skill's spec-source clarification procedure; do not
silently mark Spec as passing.

Implement every reported finding and commit the corrections. For a finding
that appears mistaken or requires a product decision, obtain an explicit
resolution rather than silently dismissing it. Repeat `code-review` against
the same target until both axes have no unresolved findings. A legitimately
unavailable spec must be explicitly acknowledged using that skill's procedure.
If the skill or its required review execution is unavailable, report a blocker
and leave the change unlanded.

## Verify the final change

Check runtime compatibility against the current dependency engines in
`package-lock.json`. The inspected Astro dependency requires Node >=22.12.0
and npm >=9.6.5; recheck rather than relying on those cached values.

For application, dependency, or tooling changes, install reproducibly with
`npm ci`, then run:

```sh
npm run lint
npm run format:check
npm run build
```

Source: `package.json` defines these exact invocations as `eslint .`,
`prettier . --check`, and `astro build`. Its `test` script is an intentional
failing placeholder, not an automated test suite. If the scripts change, use
their current definitions and any newly required tests. For documentation-only
changes, run `npm run format:check` and any additional checks required by current
repository policy; lint and build are optional unless policy requires them.

Investigate failures and implement corrections rather than bypassing checks.
Dependency audit findings are not automatically resolved by a successful build:
disclose them and address any that review or policy identifies as blockers.
If a correction changes the reviewed revision, recommit, repeat review, and
rerun the applicable checks. All required local checks must pass on the exact
final tree being landed.

## Publish and merge

1. Push the feature branch to `origin` without force. Open a pull request, or
   update the existing one, targeting `main`. Use non-interactive title and
   body-file arguments. Apply the existing `pr` skill for generated PR text,
   subject to any human-authorship requirement in repository policy. Include
   relevant issue references, scope, verification, and unresolved limitations.
2. Read the pull request's final head SHA, review state, mergeability, and
   required-check status. Recheck current target requirements, including any
   merge queue. Use `gh pr checks <number> --required` to inspect required
   checks; bounded `--watch` may be used to wait. These options are supported
   by `gh pr checks --help`. Confirm that statuses apply to the final head,
   and to a merge candidate if required by repository rules.
3. Every required check and review must have passed. Pending, failing,
   missing, cancelled, or unverifiable required checks are blockers. An absence
   of checks is acceptable only when repository requirements actually require
   none. An API or permission error is not evidence of absent requirements.
   Address actionable PR review findings too, then repeat local review and
   checks and wait for approvals and checks on the new revision.
4. Synchronize with an advanced target if necessary. Resolve conflicts
   automatically when intent is clear, preserving unrelated work. For
   ambiguous conflicts, stop and describe the conflict for the user. After
   any resolution, repeat review and required verification; review against
   the updated pinned target SHA.
5. Once the reviewed and verified revision satisfies every requirement,
   squash-merge using `gh pr merge <number> --squash --match-head-commit <sha>`.
   These flags are supported by `gh pr merge --help`; confirm squash merging
   remains allowed. Never use an administrative bypass. If a required merge
   queue dictates the method, follow that mechanism without bypassing it and
   wait for actual completion. A queued or auto-merge-enabled PR is not yet
   landed. If the configured mechanism cannot complete, report the blocker.

## Confirm completion

Read the pull request state and merge commit, fetch `origin/main`, and verify
the merge commit is present in its history. Only then report the changes as
landed, including the PR URL, merge commit, and verification results.

Preserve local work and avoid automatic branch deletion or checkout cleanup.
If any step blocks completion, clearly state that the changes have not landed
and identify the blocker and any branch or pull request already published.
