---
name: deliver-spec
description: >-
  Deliver a Gensai spec by running implement-spec-loop, then pr-to-gh, then
  pr-review-loop. Use when asked to implement, publish and follow a spec
  through review and mark its PR ready to merge as one workflow.
---

# Deliver spec

Run the following skills sequentially in the current chat. Pass all supplied
arguments and context to `implement-spec-loop` without narrowing or rewriting the
request. If no input was supplied, ask for the spec or issue reference.

A request to run `deliver-spec` authorizes implementation, scoped commits and
ordinary pushes, PR publication, scheduled review fixes, and the readiness label
and approval comment defined below. It does not authorize merging the PR.
Creating or editing this skill does not run it.
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
   Override that skill's merge action, merge authorization, merge completion
   condition and completion sounds for this workflow. Carry this override into
   the saved prompt and retain it on schedule updates: keep all of its current-head
   review and readiness gates, but once they pass, leave the PR open, add the
   `ready-to-merge` label, and post the exact comment
   `deliver-spec skill approves this PR`. Create the repository label if absent.
   Refresh the head and readiness evidence immediately before these actions; if
   they changed, evaluate the new state first. Reuse an existing label and matching
   approval comment on resumed cycles, and record the approved head SHA and
   completion in the review loop's ledger. Confirm both the label and comment
   exist on the PR, then disable the review automation and report completion once.
   If either action fails, delivery remains incomplete; resume without duplicating
   successful actions. If the PR is merged or closed before approval, stop
   monitoring and report that state without claiming delivery approval.
   Report the PR URL and monitoring status. Delivery is complete only when the
   readiness label and approval comment are confirmed; scheduled monitoring may
   continue after this turn until then.

If a required skill is unavailable or a step is blocked, report the blocker and
any branch or PR already created. Resume from the first incomplete step, reusing
the existing branch, PR and review automation rather than duplicating them.
