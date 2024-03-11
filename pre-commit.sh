#!/usr/bin/env bash

# Add this to your git commits:
#
# $ cp pre-commit.sh .git/hooks/pre-commit
# $ chmod ug+x .git/hooks/*

set -eo pipefail
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
npm run build
npm test
npm run eslint-ci
npm run prettier-ci
