---
name: deliver-spec
description: >-
  Deliver a Gensai spec by running implement-spec-loop, then pr-to-gh, then
  pr-review-loop. Use when asked to implement, publish and follow a spec
  through review and merge readiness as one workflow.
---

# Deliver spec

Run the following skills sequentially in the current chat. Pass all supplied
arguments and context to `implement-spec-loop` without narrowing or rewriting the
request. If no input was supplied, ask for the spec or issue reference.

A request to run `deliver-spec` authorizes implementation, scoped commits and
ordinary pushes, PR publication, and the scheduled fixes and readiness labeling
defined by `pr-review-loop`. Merging requires an explicit user request. Creating or editing this skill does not run it.
Preserve the user's constraints throughout.

## Workflow

1. Read and apply [implement-spec-loop](../implement-spec-loop/SKILL.md) with the original
   input. Follow `docs/agents/issue-tracker.md` before reading tickets and
   `docs/agents/domain.md` before exploring code. Finish all implementation,
   verification and code review before proceeding. In this workflow, defer PR
   publication to step 2 and leave issue closure to GitHub when the PR merges.
   Retain the integration branch, spec and ticket references, and check results
   for the next step.
2. Read and apply [pr-to-gh](../pr-to-gh/SKILL.md) to that integration branch,
   carrying forward the spec, ticket references and verification evidence. Reuse
   any matching PR from an earlier run. Proceed only after publication succeeds
   and the PR URL and head are verified. Mark a completed implementation's draft
   PR ready for review before the next step, unless the user requested a draft.
3. Read and apply [pr-review-loop](../pr-review-loop/SKILL.md) with the exact PR
   URL from step 2 and the originating spec. Start its first cycle and schedule
   subsequent cycles under that skill's rules, honoring any supplied cadence.
   Report the PR URL and monitoring status. Delivery is complete only when the
   PR is labeled `ready-to-merge`, or confirmed merged if the user explicitly
   requested merging; scheduled monitoring may continue after this turn.

If a required skill is unavailable or a step is blocked, report the blocker and
any branch or PR already created. Resume from the first incomplete step, reusing
the existing branch, PR and review automation rather than duplicating them.
