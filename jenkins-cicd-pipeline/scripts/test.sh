#!/bin/bash

# Navigate to the project directory
cd "$(dirname "$0")/.."

# Run tests
echo "Running tests..."

# Example command to run tests (replace with actual test command)
npm test

# Check the exit status of the test command
if [ $? -ne 0 ]; then
  echo "Tests failed!"
  exit 1
else
  echo "All tests passed!"
fi