# Financial Transaction Testing for Solana RPS Game

This directory contains scripts for testing the financial transactions in the Solana Rock-Paper-Scissors game.

## Overview

The financial transaction tests comprehensively validate both SOL and RPSToken transactions throughout the game lifecycle. These tests verify:

1. Game creation transactions (including fee collection)
2. Game joining transactions (including wager deposits)
3. Token transfers during gameplay
4. Fee calculations and collections
5. Prize distribution at game completion

## Key Test Scripts

- `test-financial-transactions.ts`: Comprehensive test for both SOL and RPSToken transactions
- `test-fee-collection.ts`: Focused on fee calculation and collection
- `mock-fee-test.ts`: Mock testing for fee calculations without blockchain interactions

## Running the Tests

### Prerequisites

Ensure you have:
1. Node.js and npm installed
2. Solana CLI tools installed
3. A funded Solana devnet wallet (for on-chain tests)

### Setup

1. Generate test wallets if you don't have them already:
   ```
   npm run generate-wallets
   ```

2. Fund the test wallets:
   ```
   npm run fund-wallets
   ```

3. Check wallet balances to ensure funding was successful:
   ```
   npm run check-balances
   ```

### Running the Financial Transaction Tests

To run only the financial transaction tests:

```
npm run test-financial-transactions
```

To run all tests including financial transactions:

```
npm run run-all-tests
```

For a comprehensive test suite that includes mock tests and financial tests:

```
npm run test-comprehensive
```

## Test Configuration

Configuration for tests is in the `config.json` file in the parent directory. Key settings include:

- `networkUrl`: The Solana network endpoint (defaults to devnet)
- `programId`: The deployed program ID for the RPS game
- `feePercentage`: Expected fee percentage (default 0.1%)
- `wagerAmounts`: Array of wager amounts to test with
- `feeCollectorAddress`: Public key for the fee collection account

## Understanding Test Results

The test results are saved in the `results` directory as JSON files:

- `financial-transaction-results.json`: Results from SOL and RPSToken transaction tests
- `fee-results.json`: Results from fee collection tests

Each result includes:
- Transaction ID
- Pre-transaction and post-transaction balances
- Expected vs. actual fees
- Success/failure status and error messages if applicable

## Debugging Failed Tests

If a test fails:

1. Check the error message in the console output
2. Look for the specific transaction ID in the test results
3. Use `solana confirm <transaction-id>` to get details from the Solana blockchain
4. Examine the pre/post balance changes to identify discrepancies

## Extending the Tests

To add new test cases:

1. Modify the `test-financial-transactions.ts` script
2. Add new test scenarios to the `runGameCycleTest` function
3. Add any new currency modes or transaction types as needed
4. Update the result reporting to include your new test cases
