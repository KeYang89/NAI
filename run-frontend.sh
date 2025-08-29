#!/usr/bin/env bash
set -e

# Navigate to frontend directory
cd "$(dirname "$0")/frontend"

# Install dependencies
echo "Installing frontend dependencies..."
npm install

# Start the dev server
echo "Starting frontend..."
npm run dev
