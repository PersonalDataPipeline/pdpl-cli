#!/usr/bin/env bash
# Add this to your git commits:
# cp pre-commit.sh .git/hooks/pre-commit

set -eo pipefail
npm run build
npm run eslint-ci
npm run prettier-ci
