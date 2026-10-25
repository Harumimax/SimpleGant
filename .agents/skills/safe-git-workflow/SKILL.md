---
name: safe-git-workflow
description: Keep SimpleGant code and documentation changes scoped and reviewable in Git. Use before modifying repository files; if Git is not initialized yet, preserve the same file-safety practices without requiring Git commands.
---

# Safe Git Workflow

Treat Git as the safety layer when the workspace is a repository.

Before meaningful edits:

1. Check `git status --short` and, when useful, `git diff --stat`.
2. Identify unrelated user changes and preserve them.
3. Inspect existing changes in any file that must also be edited.

While editing:

- keep changes limited to the requested feature and its tests or documentation;
- never discard, overwrite, stage, or commit unrelated changes;
- do not rewrite history or run destructive Git commands unless the user explicitly requests them;
- do not commit secrets, local environment files, database dumps, generated build output, or runtime credentials;
- update `docs/architecture.md` only when an architectural contract actually changes.

After editing:

1. Review the scoped diff and repository status.
2. Run the relevant verification from the feature workflow.
3. Report changed files and any pre-existing unrelated changes.
4. Suggest an imperative commit message; create a commit only when the user asks.

If Git is not initialized or sandbox restrictions prevent Git inspection, say so briefly and continue with careful, scoped file edits. Do not initialize a repository unless the user asks.
