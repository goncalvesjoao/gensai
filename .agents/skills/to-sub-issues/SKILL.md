---
name: to-sub-issues
description: Break a plan, spec, or conversation into tracer-bullet GitHub tickets under the source spec's parent issue, each declaring its blockers.
---

# To sub-issues

Break a plan, spec, or conversation into a set of **tickets**: tracer-bullet vertical slices, each declaring the tickets that **block** it.

Before reading or updating issues, read `docs/agents/issue-tracker.md`.
Before applying labels, read `docs/agents/triage-labels.md`.
Before exploring the codebase, read `docs/agents/domain.md`.

## Process

### 1. Gather context

Work from whatever is already in the conversation context. If the user passes a reference (a spec path, an issue number or URL) as an argument, fetch it and read its full body and comments.

Resolve one parent issue per source spec in `goncalvesjoao/gensai`:

- If the spec is already a GitHub issue, use that issue as the parent.
- For a file, plan, or conversation, reuse an issue explicitly associated with that source. If none exists, draft a parent issue containing the spec and its source reference. Create it before its tickets after the breakdown is approved.
- If the source or parent is ambiguous, clarify it before publishing. For multiple specs, keep each spec's tickets under its own parent.

Read the parent's existing sub-issues before drafting to avoid duplicating tickets on reruns.

### 2. Explore the codebase (optional)

If you have not already explored the codebase, do so to understand the current state of the code. Ticket titles and descriptions should use the project's domain glossary vocabulary, and respect ADRs in the area you're touching.

Look for opportunities to prefactor the code to make the implementation easier. "Make the change easy, then make the easy change."

### 3. Draft vertical slices

Break the work into **tracer bullet** tickets.

<vertical-slice-rules>

- Each slice cuts a narrow but COMPLETE path through every layer (schema, API, UI, tests): vertical, NOT a horizontal slice of one layer
- A completed slice is demoable or verifiable on its own
- Each slice is sized to fit in a single fresh context window
- Any prefactoring should be done first

</vertical-slice-rules>

Give each ticket its **blocking edges**: the other tickets that must complete before it can start. A ticket with no blockers can start immediately.

**Wide refactors are the exception to vertical slicing.** A **wide refactor** is one mechanical change (rename a column, retype a shared symbol) whose **blast radius** fans across the whole codebase, so a single edit breaks thousands of call sites at once and no vertical slice can land green. Don't force it into a tracer bullet; sequence it as **expand–contract**. First expand: add the new form beside the old so nothing breaks. Then migrate the call sites over in batches sized by blast radius (per package, per directory), each batch its own ticket blocked by the expand, keeping CI green batch to batch because the old form still exists. Finally contract: delete the old form once no caller remains, in a ticket blocked by every migrate batch. When even the batches can't stay green alone, keep the sequence but let them share an integration branch that all block a final integrate-and-verify ticket; green is promised only there.

### 4. Quiz the user

Present the proposed breakdown as a numbered list. For each ticket, show:

- **Title**: short descriptive name
- **Blocked by**: which other tickets (if any) must complete first
- **What it delivers**: the end-to-end behaviour this ticket makes work

Include the source spec and parent issue URL, or the proposed parent title and body if it must be created, in the breakdown for approval.

Ask the user:

- Does the granularity feel right? (too coarse / too fine)
- Are the blocking edges correct: does each ticket only depend on tickets that genuinely gate it?
- Should any tickets be merged or split further?

Iterate until the user approves the breakdown.

### 5. Publish the tickets to GitHub

Create or reuse the approved spec parent, then publish one issue per ticket in dependency order, blockers first. Use `gh issue create --body-file` as documented by the repository. Apply `ready-for-agent` to the tickets unless instructed otherwise.

Every ticket must be a native GitHub sub-issue of its spec parent. A body link alone is insufficient. After creating each ticket, attach it with `gh api`:

```sh
repo=goncalvesjoao/gensai
# Set parent_number and child_number to the actual issue numbers.
child_id=$(gh api "repos/$repo/issues/$child_number" --jq '.id')
gh api --method POST "repos/$repo/issues/$parent_number/sub_issues" \
  -F sub_issue_id="$child_id"
gh api "repos/$repo/issues/$child_number/parent" --jq '.html_url'
```

`sub_issue_id` is the child's numeric REST ID, not its issue number or GraphQL node ID. Verify the returned parent URL matches the intended spec parent. See [GitHub's sub-issue API](https://docs.github.com/en/rest/issues/sub-issues).

Keep blocking dependencies separate from parentage. Use native blocking relationships when available and list blocking issue URLs in each ticket's "Blocked by" section. A shared parent does not imply a dependency between siblings.

If creation or linking fails, stop publishing and report the parent, tickets already created, and missing links. On retry, inspect and reuse those issues rather than creating duplicates. Preserve any existing different parent and resolve that conflict with the user.

Leave the parent's body, labels, and state unchanged when reusing it. Adding the approved sub-issues is the intended parent update. Leave the parent open for the user to close.

Publication is complete only when every ticket's native parent has been verified. Report the parent URL and child issue URLs, grouped by spec.

Work the **frontier**: any ticket whose blockers are all done. For a purely linear chain that means top to bottom.

<issue-template>

## Parent

The spec parent issue URL. Required for every ticket, alongside the native sub-issue relationship.

## What to build

The end-to-end behaviour this ticket makes work, from the user's perspective, not layer-by-layer implementation.

## Acceptance criteria

- [ ] Criterion 1
- [ ] Criterion 2

## Blocked by

- A reference to each blocking ticket, or "None (can start immediately)".

</issue-template>

In ticket bodies, avoid specific implementation file paths or code snippets: they go stale fast. Keep the source spec reference in the parent. Exception: if a prototype produced a snippet that encodes a decision more precisely than prose can (state machine, reducer, schema, type shape), inline it and note briefly that it came from a prototype. Trim to the decision-rich parts, not a working demo, just the important bits.
