#!/usr/bin/env bash
set -e

# Navigate to backend directory
cd "$(dirname "$0")/backend"

# Create venv if it doesn't exist
if [ ! -d ".venv" ]; then
  echo "Creating virtual environment..."
  python3 -m venv .venv
fi

# Activate venv
source .venv/bin/activate

# Install requirements
if [ -f "requirements.txt" ]; then
  echo "Installing requirements..."
  pip3 install --upgrade pip
  pip3 install -r requirements.txt
fi

# Run the backend
echo "Starting backend..."
python3 -m app.run
