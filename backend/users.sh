#!/bin/bash

# User Management Script Wrapper
# Usage: ./users.sh <ACTION> <EMAIL> [PASSWORD]

set -e

# Check if running in Heroku
if [ -n "$DYNO" ]; then
  # Running in Heroku
  cd /app/backend
  npm run users -- "$@"
else
  # Running locally
  npm run users -- "$@"
fi

