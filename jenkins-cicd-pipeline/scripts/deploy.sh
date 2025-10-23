#!/bin/bash

# Navigate to the project directory
cd "$(dirname "$0")/.."

# Pull the latest changes from the repository
git pull origin main

# Build the Docker image
docker build -t my-app:latest .

# Push the Docker image to the registry
docker tag my-app:latest my-docker-registry/my-app:latest
docker push my-docker-registry/my-app:latest

# Deploy the application (this is a placeholder, replace with actual deployment commands)
echo "Deploying the application..."
# Example: kubectl apply -f k8s/deployment.yaml

echo "Deployment completed."