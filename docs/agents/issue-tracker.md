# Issue tracker: GitHub

Issues and specs live in GitHub Issues for goncalvesjoao/gensai.
Use the gh CLI from this repository.

## Conventions

- Create an issue: `gh issue create --title "..." --body-file <file>`.
- Read an issue and discussion: `gh issue view <number> --comments`.
- Fetch issue metadata: `gh issue view <number> --json number,title,body,labels,comments`.
- List issues: `gh issue list --state open --json number,title,body,labels`.
  Use --label and --state filters as needed.
- Comment: `gh issue comment <number> --body-file <file>`.
- Apply or remove labels: `gh issue edit <number> --add-label "..."` or
  `gh issue edit <number> --remove-label "..."`.
- Close an issue: `gh issue close <number>`.

For multiline bodies and comments, write the text to a file and use --body-file.
gh infers the repository from the Git remote.

## Pull requests as a triage surface

PRs as a request surface: no.

## Skill instructions

When a skill says "publish to the issue tracker", create a GitHub issue.
When a skill says "fetch the relevant ticket", read the issue and its comments.

## Ship-it identity

- Mode: machine account, authenticated through isolated `gh login`.
- Expected GitHub account: `itsjohngon`.
- Human reviewer: `goncalvesjoao`. Request review only at
  `status/ready-for-merge` or `status/blocked`. When assignment is needed and
  the PR is unassigned, assign this reviewer and preserve existing assignments.
- Commit identity: `itsjohngon <itsjohngon@gmail.com>`.
- Repository: `github.com/goncalvesjoao/gensai`.
- `copilot_review: true`.

Before every Ship-it run, delegated or nested worker, resumed run, and scheduled
tick, reload this policy. Resolve the helper with
`git rev-parse --path-format=absolute --git-common-dir`; it is
`<git-common-dir>/ship-it/run`. Run GitHub commands and Git writes/network
operations through this helper with `--account itsjohngon`, followed by `gh` or
`git` and its arguments. Use explicit GitHub repository/host arguments.

Each machine or independent clone requires local provisioning. The helper,
configuration, and credentials stay outside the working tree. Isolated login
credentials live in `<git-common-dir>/ship-it/gh`, with directory mode 700 and
`hosts.yml` mode 600. Absolute machine paths and credentials stay untracked.
Standard GitHub HTTPS and SSH URLs are supported through per-command HTTPS
authentication. Custom SSH aliases, ports, rewrites, and Enterprise hosts require
separate review.

Missing setup, credentials, or an identity mismatch stops affected operations
without falling back to another account. Local inspection and drafting may
continue; monitoring must pause without unauthenticated GitHub writes.
