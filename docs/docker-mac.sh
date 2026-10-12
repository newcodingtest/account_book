#!/bin/sh
set -eu
script_dir=$(CDPATH= cd "$(dirname "$0")" && pwd)
cd "$script_dir/.."
DUCKDNS_UID=$(id -u)
DUCKDNS_GID=$(id -g)
export DUCKDNS_UID DUCKDNS_GID
exec docker compose --env-file .env -f compose.yaml -f docs/compose.mac.yaml "$@"
