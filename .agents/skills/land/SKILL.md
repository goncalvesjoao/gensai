---
name: land
description: >-
  Prepare and verify a GitHub pull request in goncalvesjoao/gensai for the user
  to merge manually.
disable-model-invocation: true
---

# Land

An explicit `/land` request authorizes preparation, verification, and publication
of a pull request. The user owns the final merge. Stop at the manual handoff;
do not merge the PR, enable auto-merge, or enqueue it for merging.
Proceed without asking again for publication permission. Stop for genuine blockers
or unresolved scope.

## Prepare the change

1. Read applicable repository instructions, contribution policies, and submission
   templates. Follow `docs/agents/domain.md`; before reading linked tickets, read
   `docs/agents/issue-tracker.md`. Honor applicable signing, contributor agreements,
   human-authored submission text, documentation, changelog, and review requirements,
   including their conditions and exceptions. Obtain required human-authored text
   from the user rather than substituting generated text.
2. Inspect Git status, branches, remotes, and the requested diff. Establish exactly
   which files and commits belong to the request. Preserve unrelated staged,
   unstaged, and untracked work; stage explicit paths or hunks. Ask if scope remains
   ambiguous. Do not create an issue merely to land a change.
3. Verify the source remote `origin` identifies `goncalvesjoao/gensai` on GitHub and
   `gh` authentication is available. Publish through `origin`, never the `local`
   backlink. Stop on an unexpected repository or unavailable authentication.
4. Fetch `origin` and confirm `main` remains the intended default target. Inspect
   current branch protection, rulesets, merge methods, CI definitions, and required
   reviews. An API error is not evidence that requirements are absent. Resolve an
   unexpected target before proceeding.
5. Create an unused feature branch, or reuse the requested change's feature branch
   and matching pull request. Commit requested uncommitted changes non-interactively.
   Prefix editor-capable Git operations with `GIT_EDITOR=true`, provide commit
   messages explicitly, and preserve configured signing. Use ordinary pushes and
   merge the latest target into the feature branch when synchronization is needed.
   Preserve unrelated work; do not force-push, rewrite shared history, or use
   destructive resets.

## Conflicts

Resolve conflicts automatically when the intended result is clear, preserving
unrelated changes. Pause and explain ambiguous conflicts or unsafe resolutions.
After any resolution, inspect the resulting diff and repeat all applicable
verification on the resolved revision.

## Verify the final revision

Check Node and npm compatibility against dependency engines in `package-lock.json`.
The inspected Astro dependency requires Node >=22.12.0 and npm >=9.6.5; use the
current manifest requirements if they change.

For application, dependency, or tooling changes, install reproducibly with
`npm ci`, then run:

```sh
npm run lint
npm run format:check
npm run build
```

Source: `package.json` defines these invocations as `eslint . --max-warnings=0`,
`prettier --check .`, and `astro build`; `package-lock.json` supplies the locked
dependency tree for `npm ci`. Recheck current definitions before running. The
current `npm test` is an intentional failing placeholder, not a test suite. If
real tests or other required checks are introduced, run them as applicable.

For documentation-only changes, run `npm run format:check` and any checks required
by current repository policy. Lint and build are optional for that case unless
policy requires them.

Inspect the final diff for accidental changes and consistency with the request.
Investigate failures, commit corrections, and repeat applicable verification after
each change. Disclose dependency audit findings; address any that current policy
or review identifies as blockers rather than treating a build as security evidence.
Every required local check must pass on the exact final tree being published.

## Publish and verify

1. Push the feature branch to `origin` without force. Open or update its pull request
   targeting `main`. Use an explicit title and body file, with the change scope,
   verification results, relevant issue references, and known limitations. Preserve
   applicable submission-template and human-authorship requirements.
   A non-interactive creation invocation is
   `gh pr create --base main --head <branch> --title <title> --body-file <file>`;
   flags are defined by `gh pr create --help`. Push before creating the PR.
2. Inspect the PR's final head SHA, mergeability, required checks, and reviews.
   Recheck current destination requirements, including any merge queue.
   `gh pr checks <number> --required` inspects required checks
   (source: `gh pr checks --help`); bounded `--watch` may wait for completion.
   Ensure results apply to the final head and any merge candidate required by
   repository rules.
3. Require all applicable checks and reviews to have passed before reporting the PR
   ready for manual merge. Pending,
   failing, missing, cancelled, or unverifiable required results are blockers.
   No remote checks is acceptable only when current repository requirements require
   none. Address actionable review findings and repeat verification after edits.
4. If the target advances and synchronization is needed, merge its latest revision
   into the feature branch, handle conflicts as above, and repeat verification,
   publication, and required reviews/checks on the updated head.

## Hand off for manual merge

Report the PR URL, verified head SHA, local verification results, remote check and
review status, and known limitations. State that the PR is ready for the user to
merge manually only when all applicable requirements have passed. Preparation is
complete at this handoff; do not report the change as landed.

Leave branches and unrelated local work intact. If a blocker prevents completion,
identify the blocker and report any branch or PR already published. Leave the PR
open for the user to review and merge.
