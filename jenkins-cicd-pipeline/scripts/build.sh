#!/bin/bash

# Navigate to the application directory
cd "$(dirname "$0")/.."

# Install dependencies
npm install

# Build the application
npm run build

# Exit with the status of the last command
exit $?