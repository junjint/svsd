#!/bin/sh
# Ask the running web dev server (port 8090) for a full, non-lazy bundle and
# report whether Metro could build it. Usage: sh scripts/check-bundle.sh
URL='http://localhost:8090/node_modules/expo-router/entry.bundle?platform=web&dev=true&hot=false&lazy=false&transform.engine=hermes&transform.routerRoot=src%2Fapp&unstable_transformProfile=hermes-stable'
OUT=$(curl -s -w '\n%{http_code}' "$URL")
CODE=$(printf '%s' "$OUT" | tail -n1)
if [ "$CODE" = "200" ]; then echo "bundle OK"; else printf '%s' "$OUT" | head -c 3000; echo; echo "bundle FAILED ($CODE)"; exit 1; fi
