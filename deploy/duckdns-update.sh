#!/bin/sh
set -eu

case "${DUCKDNS_SUBDOMAIN:-}" in
  ""|*[!a-z0-9-]*|-*|*-)
    printf '%s\n' 'DuckDNS: set a lowercase subdomain without .duckdns.org.' >&2
    exit 2
    ;;
esac
if [ "${#DUCKDNS_SUBDOMAIN}" -gt 63 ]; then
  printf '%s\n' 'DuckDNS: subdomain is too long.' >&2
  exit 2
fi

token="${DUCKDNS_TOKEN:-}"
unset DUCKDNS_TOKEN
case "$token" in
  ""|*[!a-zA-Z0-9-]*)
    printf '%s\n' 'DuckDNS: set DUCKDNS_TOKEN in .env to the account token.' >&2
    exit 2
    ;;
esac

update_dns() {
  # Read the query via stdin so the token is absent from process arguments/logs.
  # Force IPv4 because DuckDNS automatic IP detection supports IPv4 only.
  if response=$(curl --ipv4 --silent --fail --connect-timeout 10 --max-time 30 --config - 2>/dev/null <<EOF
url = "https://www.duckdns.org/update"
get
 data-urlencode = "domains=$DUCKDNS_SUBDOMAIN"
 data-urlencode = "token=$token"
 data-urlencode = "ip="
EOF
  ); then
    if [ "$response" = "OK" ]; then
      printf '%s\n' 'DuckDNS update: OK'
      return 0
    fi
    printf '%s\n' 'DuckDNS update: rejected; check the token and subdomain.' >&2
  else
    printf '%s\n' 'DuckDNS update: network request failed; will retry.' >&2
  fi
  return 1
}

case "${1:-}" in
  --once) update_dns; exit $? ;;
  "") ;;
  *) printf '%s\n' 'Usage: update.sh [--once]' >&2; exit 2 ;;
esac

while :; do
  update_dns || true
  sleep 300
done
