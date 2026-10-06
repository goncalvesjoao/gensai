---
name: pr-to-gh
description: >-
  Publish a Gensai change as a GitHub pull request using the pr skill to write
  its body. Use when asked to open a PR with pr-to-gh, including as a step
  in another skill's workflow.
---

# PR to GitHub

Use `pr` to write the body, then open the pull request in `goncalvesjoao/gensai`.
A request to run this workflow authorizes scoped commits, ordinary pushes and PR
publication. Creating or editing this skill does not run it. Stop after publishing;
merging and starting a review loop belong to separate workflows.

## Prepare

1. Read applicable repository instructions and submission templates. Follow
   `docs/agents/domain.md`; read `docs/agents/issue-tracker.md` before fetching
   linked issues.
2. Inspect Git status, the branch and its diff. Identify the requested change and
   preserve unrelated work. Verify `origin` points to `goncalvesjoao/gensai` on
   GitHub and `gh` authentication works. Stop on unavailable access or an
   unexpected repository.
3. Fetch `origin` and resolve the intended base from the user's request or the
   remote default branch. Reuse the change's feature branch or create one if on
   the base branch. Check for an existing open PR for that head and base; reuse
   it on reruns. Clarify ambiguous scope or PR matches.
4. Run the checks required by current repository policy and appropriate to the
   diff. Inspect the final diff and fix scoped failures before publication.
   Commit only requested paths or hunks, preserving configured signing. Use
   explicit commit messages and `GIT_EDITOR=true` for editor-capable operations.

## Write and publish

1. Read and apply the `pr` skill at
   `/Users/goncalvesjoao/.agents/skills/pr/SKILL.md` to the final change. Save its
   resulting body in a temporary Markdown file, using actual verification
   evidence. Include supplied issue references and honor any repository template.
   Stop if the skill is unavailable. Choose a title describing the final change.
2. Push the feature branch to `origin` without force. Create the PR with
   `gh pr create --repo goncalvesjoao/gensai --base <base> --head <branch> --title <title> --body-file <file>`.
   Honor a requested draft with `--draft`. For an existing matching PR, use
   `gh pr edit <number> --repo goncalvesjoao/gensai --title <title> --body-file <file>`.
   After an uncertain creation result, check for the matching PR before retrying.
3. Verify the PR URL, base, head SHA and body on GitHub. Attach the PR to this chat
   with `attach_artifact` when available. Report its URL and verification results;
   distinguish pending remote checks from local checks that passed. If blocked,
   report the blocker and any branch or PR already published.
