#!/usr/bin/env bash
# PostToolUse hook (Edit|Write): layer-1 of the local quality model from
# m3l3 — auto-fix lint/format immediately, and run any Vitest tests that
# already cover the edited file, feeding results back via additionalContext.
# PostToolUse can't block or undo an edit (it only fires after success), so
# this only ever informs — it never replaces `pnpm check`/`pnpm test` before
# considering work done.

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$repo_root"

input=$(cat)
file_path=$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty')

[[ -z "$file_path" ]] && exit 0

case "$file_path" in
	*.ts | *.tsx) ;;
	*) exit 0 ;;
esac

[[ -f "$file_path" ]] || exit 0

context=""

if ! biome_out=$(pnpm exec biome check --write "$file_path" 2>&1); then
	context+="Biome check found issues in ${file_path} after auto-fix:
${biome_out}

"
fi

# Only run related tests for files with actual coverage (src/lib/**, and test
# files themselves) — running it on every touched file would be slow noise.
if [[ "$file_path" == src/lib/* || "$file_path" == *.test.ts || "$file_path" == *.test.tsx ]]; then
	if ! test_out=$(pnpm exec vitest related "$file_path" --run 2>&1); then
		context+="Related Vitest tests failed for ${file_path}:
${test_out}
"
	fi
fi

if [[ -n "$context" ]]; then
	jq -n --arg ctx "$context" '{hookSpecificOutput: {hookEventName: "PostToolUse", additionalContext: $ctx}}'
fi

exit 0
