# Remove duplicate directories and lock files
rm -rf backend/backend
rm -rf testing/testing
rm -rf frontend/package-lock.json
rm -rf testing/package-lock.json
rm -rf backend/package-lock.json
rm -rf */*/package-lock.json
rm -rf */bun.lockb
rm -rf */*/bun.lockb

# Clean all node_modules
rm -rf node_modules
rm -rf frontend/node_modules
rm -rf testing/node_modules
rm -rf backend/node_modules