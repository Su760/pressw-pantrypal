#!/bin/sh
set -eu
cd "$(dirname "$0")/../.."
./node_modules/.bin/tsc src/app/api/chat/route.ts \
  --outDir dist/backend-tests --module commonjs --target ES2022 \
  --esModuleInterop --resolveJsonModule --skipLibCheck --strict
env -u OPENAI_API_KEY -u TAVILY_API_KEY -u OPENAI_MODEL \
  node --require ./tests/backend/no-network.cjs --test --test-timeout=5000 tests/backend/*.test.cjs
