# Remove duplicate directories
rm -rf backend/backend
rm -rf testing/testing

# Create proper structure
mkdir -p backend/solana-program/src
mkdir -p frontend/src
mkdir -p frontend/config
mkdir -p testing/src

# Clean all node_modules
rm -rf node_modules
rm -rf frontend/node_modules
rm -rf testing/node_modules
rm -rf backend/node_modules
