#!/usr/bin/env bash
set -e

cd "$(dirname "$0")/docs/presentation"

if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

echo "Starting presentation on http://localhost:3003"
npm run dev
