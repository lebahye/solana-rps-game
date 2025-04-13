import { Connection, LAMPORTS_PER_SOL, clusterApiUrl, PublicKey } from '@solana/web3.js';
import {
  loadWallet,
  createGame,
  joinGame,
  commitChoice,
  revealChoice,
  generateRandomSalt,
  getTransactionDetails,
  getBalance
} from '../utils/solana-helpers';
import { analyzeFees, printFeeAnalysis } from '../utils/game-analyzer';
import { Choice, CurrencyMode, FeeAnalysis, TestWallet, TransactionResult } from '../types';
import * as fs from 'fs-extra';
import * as path from 'path';
import chalk from 'chalk';

// Read config
const config = fs.readJsonSync(path.join(__dirname, '../config.json'));

// Path to wallets directory
const walletsDir = path.join(__dirname, '../wallets');

// Path to results directory
const resultsDir = path.join(__dirname, '../results');

// Setup Solana connection
const connection = new Connection(config.networkUrl || clusterApiUrl('devnet'), 'confirmed');

// Fee collector address from config
const feeCollectorAddress = new PublicKey(config.feeCollectorAddress);

// Expected fee percentage from config
const expectedFeePercentage = config.feePercentage || 0.001; // Default to 0.1%

// RPS Token mint address (mock)
const RPS_TOKEN_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');

/**
 * Interface for financial transaction test results
 */
interface FinancialTestResult {
  testId: string;
  currencyMode: string;
  transactionType: string;
  amount: number;
  success: boolean;
  expectedFee: number;
  actualFee: number | null;
  error: string | null;
  transactionId: string | null;
  preBalance: number | null;
  postBalance: number | null;
  balanceChange: number | null;
}

/**
 * Run financial transaction tests for both SOL and RPSToken
 */
async function main() {
  console.log(chalk.blue('Running financial transaction tests for SOL and RPSToken...'));

  try {
    // Ensure results directory exists
    await fs.ensureDir(resultsDir);

    // Load wallets
    const walletFiles = await fs.readdir(walletsDir);
    const walletLabels = walletFiles
      .filter(file => file.endsWith('.json'))
      .map(file => file.replace('.json', ''));

    if (walletLabels.length < 3) {
      console.error(chalk.red('Need at least 3 wallets for testing. Please run "npm run generate-wallets" first.'));
      return;
    }

    // Load all wallets
    const wallets: TestWallet[] = [];
    for (const label of walletLabels) {
      const wallet = await loadWallet(label, walletsDir);
      wallets.push(wallet);
    }

    console.log(`Loaded ${wallets.length} wallets for testing`);

    // Test results storage
    const testResults: FinancialTestResult[] = [];

    // Test both currency modes
    const currencyModes = [CurrencyMode.SOL, CurrencyMode.RPS_TOKEN];

    for (const currencyMode of currencyModes) {
      console.log(chalk.yellow(`\nTesting ${currencyMode === CurrencyMode.SOL ? 'SOL' : 'RPS Token'} transactions`));

      // Test different wager amounts
      for (const wagerAmount of config.wagerAmounts) {
        console.log(`\nTesting with wager amount: ${wagerAmount} ${currencyMode === CurrencyMode.SOL ? 'SOL' : 'RPS Token'}`);

        // Run a full game cycle with this wager and currency
        try {
          await runGameCycleTest(wallets, wagerAmount, currencyMode, testResults);
        } catch (error) {
          console.error(chalk.red(`Error testing game cycle with ${wagerAmount} ${currencyMode}:`), error);

          // Add failed test result
          testResults.push({
            testId: `game-cycle-${currencyMode}-${wagerAmount}`,
            currencyMode: currencyMode === CurrencyMode.SOL ? 'SOL' : 'RPS_TOKEN',
            transactionType: 'game-cycle',
            amount: wagerAmount,
            success: false,
            expectedFee: wagerAmount * expectedFeePercentage,
            actualFee: null,
            error: error.message,
            transactionId: null,
            preBalance: null,
            postBalance: null,
            balanceChange: null
          });
        }

        // Wait a bit between tests
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Save test results
    const resultsPath = path.join(resultsDir, 'financial-transaction-results.json');
    await fs.writeJson(resultsPath, testResults, { spaces: 2 });

    console.log(chalk.green(`Results saved to: ${resultsPath}`));

    // Calculate summary statistics
    const solTests = testResults.filter(r => r.currencyMode === 'SOL');
    const rpsTokenTests = testResults.filter(r => r.currencyMode === 'RPS_TOKEN');

    const solPassedTests = solTests.filter(r => r.success).length;
    const rpsTokenPassedTests = rpsTokenTests.filter(r => r.success).length;

    console.log(chalk.yellow('\nFinancial Transaction Test Summary:'));
    console.log(`SOL Tests: ${solTests.length}, Passed: ${solPassedTests} (${((solPassedTests / solTests.length) * 100).toFixed(2)}%)`);
    console.log(`RPS Token Tests: ${rpsTokenTests.length}, Passed: ${rpsTokenPassedTests} (${((rpsTokenPassedTests / rpsTokenTests.length) * 100).toFixed(2)}%)`);

    if (solPassedTests === solTests.length && rpsTokenPassedTests === rpsTokenTests.length) {
      console.log(chalk.green('\n✓ All financial transaction tests passed!'));
    } else {
      const failedTests = testResults.filter(r => !r.success);
      console.log(chalk.red(`\n✗ ${failedTests.length} financial transaction tests failed:`));

      for (const test of failedTests) {
        console.log(chalk.red(`- ${test.currencyMode} ${test.transactionType} with ${test.amount}: ${test.error}`));
      }
    }

  } catch (error) {
    console.error(chalk.red('Error running financial transaction tests:'), error);
    process.exit(1);
  }
}

/**
 * Run a complete game cycle test
 */
async function runGameCycleTest(
  wallets: TestWallet[],
  wagerAmount: number,
  currencyMode: CurrencyMode,
  testResults: FinancialTestResult[]
): Promise<void> {
  // Select host and players
  const host = wallets[0];
  const player1 = wallets[1];

  // Track transaction signatures and balances for later analysis
  const transactionData: {
    type: string;
    transactionId: string;
    preBalance?: number;
    postBalance?: number;
  }[] = [];

  // Get initial balances
  const hostInitialBalance = await getBalance(connection, host.publicKey);
  const player1InitialBalance = await getBalance(connection, player1.publicKey);

  console.log(`Host initial balance: ${hostInitialBalance} SOL`);
  console.log(`Player 1 initial balance: ${player1InitialBalance} SOL`);

  // 1. Create Game Test
  console.log("Creating game...");
  let gameCreateResult: { gameId: string; gameAccount: PublicKey; transactionId: string };
  try {
    // Record pre-balance
    const preBalance = await getBalance(connection, host.publicKey);

    // Create the game
    gameCreateResult = await createGame(
      connection,
      host,
      2, // minPlayers
      2, // maxPlayers
      1, // totalRounds
      wagerAmount, // entryFee
      30, // timeoutSeconds
      false, // losersCanRejoin
      currencyMode
    );

    // Record post-balance
    const postBalance = await getBalance(connection, host.publicKey);

    // Store transaction data
    transactionData.push({
      type: 'create-game',
      transactionId: gameCreateResult.transactionId,
      preBalance,
      postBalance
    });

    console.log(`Game created: ${gameCreateResult.gameId}`);
    console.log(`Transaction: ${gameCreateResult.transactionId}`);

    // Add successful test result
    testResults.push({
      testId: `create-game-${currencyMode}-${wagerAmount}`,
      currencyMode: currencyMode === CurrencyMode.SOL ? 'SOL' : 'RPS_TOKEN',
      transactionType: 'create-game',
      amount: wagerAmount,
      success: true,
      expectedFee: wagerAmount * expectedFeePercentage,
      actualFee: null, // Will be calculated from transaction details
      error: null,
      transactionId: gameCreateResult.transactionId,
      preBalance,
      postBalance,
      balanceChange: preBalance - postBalance
    });
  } catch (error) {
    console.error(chalk.red("Error creating game:"), error);

    // Add failed test result
    testResults.push({
      testId: `create-game-${currencyMode}-${wagerAmount}`,
      currencyMode: currencyMode === CurrencyMode.SOL ? 'SOL' : 'RPS_TOKEN',
      transactionType: 'create-game',
      amount: wagerAmount,
      success: false,
      expectedFee: wagerAmount * expectedFeePercentage,
      actualFee: null,
      error: error.message,
      transactionId: null,
      preBalance: null,
      postBalance: null,
      balanceChange: null
    });

    throw error;
  }

  // 2. Join Game Test
  console.log("Player joining game...");
  let joinTxId: string;
  try {
    // Record pre-balance
    const preBalance = await getBalance(connection, player1.publicKey);

    // Join the game
    joinTxId = await joinGame(
      connection,
      player1,
      gameCreateResult.gameAccount,
      wagerAmount,
      currencyMode
    );

    // Record post-balance
    const postBalance = await getBalance(connection, player1.publicKey);

    // Store transaction data
    transactionData.push({
      type: 'join-game',
      transactionId: joinTxId,
      preBalance,
      postBalance
    });

    console.log(`Player joined game: ${joinTxId}`);

    // Add successful test result
    testResults.push({
      testId: `join-game-${currencyMode}-${wagerAmount}`,
      currencyMode: currencyMode === CurrencyMode.SOL ? 'SOL' : 'RPS_TOKEN',
      transactionType: 'join-game',
      amount: wagerAmount,
      success: true,
      expectedFee: wagerAmount * expectedFeePercentage,
      actualFee: null, // Will be calculated from transaction details
      error: null,
      transactionId: joinTxId,
      preBalance,
      postBalance,
      balanceChange: preBalance - postBalance
    });
  } catch (error) {
    console.error(chalk.red("Error joining game:"), error);

    // Add failed test result
    testResults.push({
      testId: `join-game-${currencyMode}-${wagerAmount}`,
      currencyMode: currencyMode === CurrencyMode.SOL ? 'SOL' : 'RPS_TOKEN',
      transactionType: 'join-game',
      amount: wagerAmount,
      success: false,
      expectedFee: wagerAmount * expectedFeePercentage,
      actualFee: null,
      error: error.message,
      transactionId: null,
      preBalance: null,
      postBalance: null,
      balanceChange: null
    });

    throw error;
  }

  // 3. Commit and Reveal Choices
  // Generate random choices for each player
  const hostChoice = Math.floor(Math.random() * 3) + 1 as Choice;
  const player1Choice = Math.floor(Math.random() * 3) + 1 as Choice;

  // Generate salts
  const hostSalt = generateRandomSalt();
  const player1Salt = generateRandomSalt();

  // Commit choices
  console.log("Committing choices...");
  try {
    const hostCommitTxId = await commitChoice(connection, host, gameCreateResult.gameAccount, hostChoice, hostSalt);
    const player1CommitTxId = await commitChoice(connection, player1, gameCreateResult.gameAccount, player1Choice, player1Salt);

    // Store transaction data
    transactionData.push({ type: 'commit-choice-host', transactionId: hostCommitTxId });
    transactionData.push({ type: 'commit-choice-player', transactionId: player1CommitTxId });

    // Add successful test results
    testResults.push({
      testId: `commit-choice-host-${currencyMode}-${wagerAmount}`,
      currencyMode: currencyMode === CurrencyMode.SOL ? 'SOL' : 'RPS_TOKEN',
      transactionType: 'commit-choice',
      amount: 0, // No direct financial impact
      success: true,
      expectedFee: 0,
      actualFee: null,
      error: null,
      transactionId: hostCommitTxId,
      preBalance: null,
      postBalance: null,
      balanceChange: null
    });

    testResults.push({
      testId: `commit-choice-player-${currencyMode}-${wagerAmount}`,
      currencyMode: currencyMode === CurrencyMode.SOL ? 'SOL' : 'RPS_TOKEN',
      transactionType: 'commit-choice',
      amount: 0, // No direct financial impact
      success: true,
      expectedFee: 0,
      actualFee: null,
      error: null,
      transactionId: player1CommitTxId,
      preBalance: null,
      postBalance: null,
      balanceChange: null
    });
  } catch (error) {
    console.error(chalk.red("Error committing choices:"), error);

    // Add failed test result
    testResults.push({
      testId: `commit-choice-${currencyMode}-${wagerAmount}`,
      currencyMode: currencyMode === CurrencyMode.SOL ? 'SOL' : 'RPS_TOKEN',
      transactionType: 'commit-choice',
      amount: 0,
      success: false,
      expectedFee: 0,
      actualFee: null,
      error: error.message,
      transactionId: null,
      preBalance: null,
      postBalance: null,
      balanceChange: null
    });

    throw error;
  }

  // Reveal choices
  console.log("Revealing choices...");
  try {
    const hostRevealTxId = await revealChoice(connection, host, gameCreateResult.gameAccount, hostChoice, hostSalt);
    const player1RevealTxId = await revealChoice(connection, player1, gameCreateResult.gameAccount, player1Choice, player1Salt);

    // Store transaction data
    transactionData.push({ type: 'reveal-choice-host', transactionId: hostRevealTxId });
    transactionData.push({ type: 'reveal-choice-player', transactionId: player1RevealTxId });

    // Add successful test results
    testResults.push({
      testId: `reveal-choice-host-${currencyMode}-${wagerAmount}`,
      currencyMode: currencyMode === CurrencyMode.SOL ? 'SOL' : 'RPS_TOKEN',
      transactionType: 'reveal-choice',
      amount: 0, // No direct financial impact
      success: true,
      expectedFee: 0,
      actualFee: null,
      error: null,
      transactionId: hostRevealTxId,
      preBalance: null,
      postBalance: null,
      balanceChange: null
    });

    testResults.push({
      testId: `reveal-choice-player-${currencyMode}-${wagerAmount}`,
      currencyMode: currencyMode === CurrencyMode.SOL ? 'SOL' : 'RPS_TOKEN',
      transactionType: 'reveal-choice',
      amount: 0, // No direct financial impact
      success: true,
      expectedFee: 0,
      actualFee: null,
      error: null,
      transactionId: player1RevealTxId,
      preBalance: null,
      postBalance: null,
      balanceChange: null
    });
  } catch (error) {
    console.error(chalk.red("Error revealing choices:"), error);

    // Add failed test result
    testResults.push({
      testId: `reveal-choice-${currencyMode}-${wagerAmount}`,
      currencyMode: currencyMode === CurrencyMode.SOL ? 'SOL' : 'RPS_TOKEN',
      transactionType: 'reveal-choice',
      amount: 0,
      success: false,
      expectedFee: 0,
      actualFee: null,
      error: error.message,
      transactionId: null,
      preBalance: null,
      postBalance: null,
      balanceChange: null
    });

    throw error;
  }

  // 4. Check Final Balances
  const hostFinalBalance = await getBalance(connection, host.publicKey);
  const player1FinalBalance = await getBalance(connection, player1.publicKey);

  console.log(`Host final balance: ${hostFinalBalance} SOL`);
  console.log(`Player 1 final balance: ${player1FinalBalance} SOL`);

  // Get transaction details for fee analysis
  const transactionDetails = [];
  for (const txData of transactionData) {
    if (txData.transactionId) {
      const details = await getTransactionDetails(connection, txData.transactionId);
      if (details) {
        transactionDetails.push({
          ...details,
          type: txData.type
        });
      }
    }
  }

  // Analyze fees across all transactions
  const feeAnalysis = analyzeFees(transactionDetails, expectedFeePercentage);

  // Print fee analysis
  console.log(chalk.yellow('\nTransaction Fee Analysis:'));
  printFeeAnalysis(feeAnalysis, expectedFeePercentage);

  // Update test results with actual fee data
  for (const result of testResults) {
    if (result.transactionId) {
      const txDetail = transactionDetails.find(tx => tx.signature === result.transactionId);
      if (txDetail) {
        result.actualFee = txDetail.fee;
      }
    }
  }

  // Add overall game cycle result
  testResults.push({
    testId: `game-cycle-complete-${currencyMode}-${wagerAmount}`,
    currencyMode: currencyMode === CurrencyMode.SOL ? 'SOL' : 'RPS_TOKEN',
    transactionType: 'game-cycle-complete',
    amount: wagerAmount,
    success: true,
    expectedFee: wagerAmount * expectedFeePercentage,
    actualFee: feeAnalysis.totalFees,
    error: null,
    transactionId: null,
    preBalance: null,
    postBalance: null,
    balanceChange: null
  });

  console.log(chalk.green(`Game cycle with ${wagerAmount} ${currencyMode === CurrencyMode.SOL ? 'SOL' : 'RPS Token'} completed successfully!`));
}

// Run the script
main().catch(err => {
  console.error(chalk.red('Error in main function:'), err);
  process.exit(1);
});
