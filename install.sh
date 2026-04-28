#!/bin/bash

set -e

TMP=$(mktemp -d)
trap "rm -rf $TMP" EXIT

curl -fsSL https://codeload.github.com/sandrodw3/liferay-dev-cli/tar.gz/refs/heads/main \
	| tar xz -C "$TMP" --strip-components=1

cd "$TMP"

deno install \
	--allow-env \
	--allow-net \
	--allow-read \
	--allow-run \
	--allow-write \
	--compile \
	src/lfr.ts \
	-f -g -r
