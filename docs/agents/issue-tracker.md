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
