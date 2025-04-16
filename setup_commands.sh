# Install Rust and Solana CLI if not already installed
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
sh -c "$(curl -sSfL https://release.solana.com/v1.16.0/install)"

# Install bun if not already installed
curl -fsSL https://bun.sh/install | bash

# Setup the project
bun run clean
bun run setup

# Build the Solana program
bun run backend:build

# Start the development server
bun run frontend:dev