#!/bin/sh
set -eu
cd "$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
if [ "$(git branch --show-current)" != main ]; then
  echo 'Publish expects the main branch.' >&2; exit 1
fi
if [ -n "$(git status --porcelain)" ]; then
  echo 'Commit the reviewed changes before publishing.' >&2; exit 1
fi
if [ ! -r .deploy/github-pages ] || [ ! -r .deploy/known_hosts ]; then
  exec git push origin main
fi
export GIT_SSH_COMMAND='ssh -F /dev/null -i .deploy/github-pages -o IdentitiesOnly=yes -o UserKnownHostsFile=.deploy/known_hosts -o StrictHostKeyChecking=yes -o BatchMode=yes -o ConnectTimeout=10'
exec git push origin main
