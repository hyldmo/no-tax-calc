#!/bin/sh

# Install git hooks
echo "Installing git hooks..."
cp scripts/hooks/pre-push .git/hooks/pre-push
chmod +x .git/hooks/pre-push
echo "✅ Git hooks installed successfully!"

