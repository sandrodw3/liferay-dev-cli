#!/bin/bash

deno install \
  --allow-env \
  --allow-net \
  --allow-read \
  --allow-run \
  --allow-write \
  --import-map https://raw.githubusercontent.com/sandrodw3/liferay-dev-cli/main/deno.json \
  https://raw.githubusercontent.com/sandrodw3/liferay-dev-cli/main/src/lfr.ts \
  -f -g -r