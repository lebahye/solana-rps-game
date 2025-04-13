# First, rename the current directory as a precaution
mv solana-rps-game solana-rps-game-problematic

# Copy the backup to create a new main directory
cp -r solana-rps-game-backup solana-rps-game

# Clean up node_modules and any build artifacts in the new directory
cd solana-rps-game
rm -rf node_modules
rm -rf frontend/node_modules
rm -rf testing/node_modules
rm package-lock.json
rm frontend/package-lock.json
rm testing/package-lock.json

# Install dependencies
npm install
cd frontend && npm install
cd ../testing && npm install