# Solana Rock Paper Scissors Game

TEST COMMIT - PLEASE IGNORE

A full-stack decentralized game built on the Solana blockchain that allows players to play Rock Paper Scissors with cryptocurrency stakes.

## Project Overview

Solana RPS Game is a decentralized Rock Paper Scissors game built on the Solana blockchain. The game allows players to compete against each other in a transparent, fair environment with cryptographic commitment schemes to ensure fairness.

## Repository Structure

- `/backend` - Solana program (smart contract) written in Rust
- `/frontend` - Web frontend interface built with React
- `/testing` - Comprehensive testing framework

## Features

- **Decentralized Gameplay**: All game mechanics are enforced by a Solana smart contract.
- **Multi-player**: Supports 3-4 player games.
- **Commit-Reveal Scheme**: Ensures fair play by preventing players from seeing others' choices.
- **Betting System**: Players can place SOL bets to compete for a prize pool.
- **Multi-Round Games**: Set up games with multiple rounds to find a true winner.
- **Timeout Resolution**: Handles players who disconnect or fail to respond.
- **Rejoining Mechanism**: Losers can rejoin for another game (if enabled).
- **Automated Gameplay**: New feature that allows for automated playing and betting.
- **Wallet Integration**: Connect with Phantom or Solflare wallets
- **Game Mechanics**: Play Rock Paper Scissors with multiple players
- **Blockchain Integration**: All game actions are recorded on the Solana blockchain
- **Token Support**: Stake SOL or custom RPS tokens
- **Auto-Play Mode**: Let the computer play for you with automated betting strategies
- **Player Matching**: System automatically matches players into games
- **Advanced Betting**: Multiple betting strategies including Martingale, D'Alembert, and Fibonacci

## Testing Framework

The project includes a robust testing framework for ensuring game security, fairness, and performance. The testing suite covers:

- **Security Tests**: Detection of vulnerabilities in the game implementation
- **Performance Benchmarks**: Measurement of critical operations performance
- **E2E Integration Tests**: Simulation of complete game flows
- **Fairness Tests**: Verification of game outcome distribution
- **Mock Testing**: Simulation of blockchain interactions for development

### Recent Testing Enhancements

The testing framework has been significantly improved with the following features:

1. **Enhanced Security Tests**: Added advanced security tests for transaction replay attacks, commitment revelation analysis, and timing attacks.
2. **Improved Commitment Hash Function**: Fixed a security vulnerability by upgrading from SHA256 to HMAC-SHA512 with increased salt size.
3. **Test Results Dashboard**: Added a visual dashboard to display test results with charts and metrics.
4. **Continuous Integration**: Set up GitHub Actions workflow for automated testing on code changes.

### Running Tests

```bash
# Navigate to testing directory
cd testing

# Install dependencies
npm install

# Generate test wallets
npm run generate-wallets

# Run all mock tests
npm run run-all-mock-tests

# Generate dashboard
npm run generate-dashboard
```

The test dashboard will be available at `testing/dashboard/index.html`.

## How the Game Works

### Game Flow

1. A player creates a game, setting player count, entry fee, number of rounds, etc.
2. Other players join the game, placing their entry fee.
3. When enough players have joined, the game starts.
4. Each round follows a commit-reveal pattern:
   - **Commit Phase**: Players select and commit their choices (Rock, Paper, or Scissors).
   - **Reveal Phase**: Players reveal their committed choices.
5. After each round, scores are calculated and the next round begins.
6. After all rounds, winners can claim their share of the prize pool.

### Scoring

- Each player's choice is compared against all other players.
- For each comparison, points are awarded according to standard Rock-Paper-Scissors rules:
  - Rock beats Scissors
  - Scissors beats Paper
  - Paper beats Rock
- Players with the highest score after all rounds win.

## Automated Gameplay

The new auto-play feature allows players to:

1. **Set a Wager Amount**: Choose how much SOL to bet on each round.
2. **Start Automated Play**: The system will automatically play rounds:
   - Creating games
   - Making random choices
   - Processing results
   - Tracking statistics
3. **View Real-time Stats**:
   - Current win/loss streak
   - Total wins and losses
   - Amount wagered
   - Net profit/loss
4. **Game History Visualization**: See a record of all games played with win/loss indicators.

This feature is perfect for players who want to:
- Test different betting strategies
- Play many games quickly
- Let the system play while they're away
- Track their performance over time

*Note: In the current implementation, auto-play runs as a simulation and doesn't make actual blockchain transactions.*

## Technology Stack

- **Blockchain**: Solana
- **Smart Contract**: Written in Rust
- **Frontend**: React with TypeScript
- **Wallet Integration**: Solana Wallet Adapter
- **Serialization**: Borsh

## Component Overview

### Solana Program (Smart Contract)

- `solana-rps-program.rs`: The Rust smart contract implementing the game logic.

### Frontend Components

- `App.tsx`: Main application component and router
- `rps-client.ts`: Client library for interacting with the Solana program
- Views:
  - `HomeView.tsx`: Main menu screen
  - `CreateGameView.tsx`: Form for creating a new game
  - `JoinGameView.tsx`: Screen for joining an existing game
  - `GameLobbyView.tsx`: Waiting room for players to join
  - `CommitChoiceView.tsx`: Screen for committing a choice
  - `RevealChoiceView.tsx`: Screen for revealing committed choices
  - `GameResultsView.tsx`: Displays game results and winner

## Getting Started

### Prerequisites

- Node.js 14+ and npm or bun
- Solana CLI tools (for deploying the program)
- A Solana wallet (Phantom, Solflare, etc.)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/solana-rps-game.git
   cd solana-rps-game
   ```

2. Install dependencies:
   ```
   bun install
   ```

3. Configure your environment variables:
   - Create a `.env` file and add your RPC endpoint and other configurations
   - Set the program ID in `App.tsx` (after deploying the Solana program)

4. Start the development server:
   ```
   bun run dev
   ```

### Frontend Development

```bash
cd frontend
bun install
bun dev
```

The development server will start at http://localhost:5173

### Deploying the Solana Program

1. Build the program:
   ```
   cd backend/solana-program
   cargo build-bpf
   ```

2. Deploy to Solana devnet:
   ```
   solana program deploy target/deploy/rps_game.so
   ```

3. Update the program ID in `App.tsx` with the address from the deployment:
   ```typescript
   const RPS_PROGRAM_ID = new PublicKey('your_program_id_here');
   ```

## Playing the Game

1. **Create a Game**:
   - Connect your wallet
   - Click "Create Game"
   - Set the entry fee, player count, rounds, etc.
   - Share the game ID with friends

2. **Join a Game**:
   - Connect your wallet
   - Click "Join Game"
   - Enter the game ID
   - Pay the entry fee

3. **Make Your Move**:
   - Choose Rock, Paper, or Scissors
   - Commit your choice
   - Wait for all players to commit

4. **Reveal Your Choice**:
   - Reveal your choice when all players have committed
   - Wait for all players to reveal

5. **See Results**:
   - View the results and scores
   - If you won, claim your winnings
   - Play additional rounds if configured

## Security

The commit-reveal scheme ensures that:
- Players cannot see others' choices during commitment
- Players cannot change their choices after commitment
- Players cannot lie about their committed choices during reveal

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Solana Foundation
- React and TypeScript communities
- All contributors and users of the game

