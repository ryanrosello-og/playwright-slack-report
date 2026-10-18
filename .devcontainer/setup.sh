#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."
# Windows bind mounts can have a different owner from the container user.
# Trust only this workspace, never every repository in the container.
workspace="$(pwd -P)"
if ! git config --global --get-all safe.directory | grep -Fxq "$workspace"; then
  git config --global --add safe.directory "$workspace"
fi

version="$(tr -d '\r\n' < .bun-version)"
export BUN_INSTALL="${BUN_INSTALL:-$HOME/.bun}"
export PATH="$BUN_INSTALL/bin:$PATH"

if ! command -v bun >/dev/null || [[ "$(bun --version)" != "$version" ]]; then
  installer="$(mktemp)"
  trap 'rm -f "$installer"' EXIT
  curl --fail --silent --show-error --location https://bun.com/install --output "$installer"
  bash "$installer" "bun-v$version"
fi

[[ "$(bun --version)" == "$version" ]]
bun install --frozen-lockfile
printf '\nReady. Run bun test for your first check. See CONTRIBUTING.md for the full workflow.\n'
