#!/bin/sh
set -e

cd "$(dirname "$0")/.."

# 1. Backend Application Build
echo "Building backend..."
npm run build

# 2. Clean up the deployment directory
echo "Cleaning up deployment directory..."
rm -rf ./infra/resources/build/

# 3. Copy build artifacts to the deployment directory
echo "Copying build artifacts..."
mkdir -p ./infra/resources/build
cp -r ./dist/* ./infra/resources/build/

echo "Build and copy completed successfully."
