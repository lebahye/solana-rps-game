use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    program_error::ProgramError,
    pubkey::Pubkey,
    system_instruction,
    program::{invoke, invoke_signed},
    sysvar::{rent::Rent, Sysvar},
    clock::Clock,
};
use std::collections::HashMap;

// Import game logic module
mod game_logic;

// Define the game state
#[derive(BorshSerialize, BorshDeserialize, Debug, Clone)]
pub enum Choice {
    None,
    Rock,
    Paper,
    Scissors,
    Lizard,
    Spock,
}

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone)]
pub enum GameMode {
    Manual,
    Automated,
}

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone)]
pub enum CurrencyMode {
    SOL,
    RPSToken,
}

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone)]
pub enum GameVariant {
    Classic,    // Rock, Paper, Scissors
    Extended,   // Rock, Paper, Scissors, Lizard, Spock
    Timed,      // Time pressure variant
    Streak,     // Streak challenge variant
    Tournament, // Tournament mode
}

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct Player {
    pub pubkey: Pubkey,
    pub choice: Choice,
    pub committed_choice: [u8; 32], // Hash of choice + salt
    pub revealed: bool,
    pub score: u8,
}

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub enum GameState {
    WaitingForPlayers,
    CommitPhase,
    RevealPhase,
    Finished,
}

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct Game {
    pub host: Pubkey,
    pub players: Vec<Player>,
    pub min_players: u8,
    pub max_players: u8,
    pub state: GameState,
    pub current_round: u8,
    pub total_rounds: u8,
    pub entry_fee: u64,
    pub game_pot: u64,
    pub required_timeout: u64,
    pub last_action_timestamp: u64,
    pub player_count: u8,        // Actual number of players (randomized between 3-4)
    pub losers_can_rejoin: bool, // Indicates if losers can rejoin for another game
    pub game_mode: GameMode,     // Manual or Automated
    pub auto_round_delay: u64,   // Time between automated rounds in seconds
    pub max_auto_rounds: u64,    // Maximum number of automated rounds
    pub current_auto_round: u64,  // Current auto round counter
    pub currency_mode: CurrencyMode, // SOL or RPSToken
    pub game_variant: GameVariant, // Classic, Extended, etc.
    pub time_limit: Option<u64>,  // Time limit for timed games (in seconds)
    pub spectators: Vec<Pubkey>,  // List of spectators
    pub chat_enabled: bool,       // Whether chat is enabled
    pub tournament_id: Option<Pubkey>, // ID of tournament this game belongs to
    pub nft_prize: bool,          // Whether this game awards an NFT prize
}

// Define instruction types
#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub enum RPSInstruction {
    // Initialize a new game
    InitializeGame {
        min_players: u8,
        max_players: u8,
        total_rounds: u8,
        entry_fee: u64,
        timeout_seconds: u64,
        losers_can_rejoin: bool,
        game_mode: u8,          // 0 = Manual, 1 = Automated
        currency_mode: u8,      // 0 = SOL, 1 = RPSToken
        auto_round_delay: u64,  // Only used if game_mode = Automated
        max_auto_rounds: u64,   // Only used if game_mode = Automated
        game_variant: u8,       // 0 = Classic, 1 = Extended, 2 = Timed, 3 = Streak, 4 = Tournament
        time_limit: Option<u64>, // Time limit for timed games
        chat_enabled: bool,     // Whether chat is enabled
        nft_prize: bool,        // Whether this game awards an NFT prize
        tournament_id: Option<Pubkey>, // ID of tournament this game belongs to
    },

    // Join an existing game
    JoinGame,

    // Submit a hashed choice (commit phase)
    CommitChoice {
        committed_choice: [u8; 32], // Hash of choice + salt
    },

    // Reveal your choice
    RevealChoice {
        choice: Choice,
        salt: [u8; 32],
    },

    // Force resolve the game if timeout occurred
    ResolveTimeout,

    // Claim winnings after game finishes
    ClaimWinnings,

    // Rejoin game as a loser (if enabled)
    RejoinGame,

    // Start a new game round with same players
    StartNewGameRound,

    // For auto-play, trigger the next round
    AutoPlayNextRound,

    // For auto-play, add bot players
    AddBotPlayers {
        count: u8,
    },
}

// Program entrypoint
entrypoint!(process_instruction);

// Process instruction logic
pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    let instruction = RPSInstruction::try_from_slice(instruction_data)?;

    match instruction {
        RPSInstruction::InitializeGame {
            min_players,
            max_players,
            total_rounds,
            entry_fee,
            timeout_seconds,
            losers_can_rejoin,
            game_mode,
            currency_mode,
            auto_round_delay,
            max_auto_rounds,
            game_variant,
            time_limit,
            chat_enabled,
            nft_prize,
            tournament_id
        } => {
            process_initialize_game(
                program_id,
                accounts,
                min_players,
                max_players,
                total_rounds,
                entry_fee,
                timeout_seconds,
                losers_can_rejoin,
                game_mode,
                currency_mode,
                auto_round_delay,
                max_auto_rounds,
                game_variant,
                time_limit,
                chat_enabled,
                nft_prize,
                tournament_id
            )
        },
        RPSInstruction::JoinGame => {
            process_join_game(program_id, accounts)
        },
        RPSInstruction::CommitChoice { committed_choice } => {
            process_commit_choice(program_id, accounts, committed_choice)
        },
        RPSInstruction::RevealChoice { choice, salt } => {
            process_reveal_choice(program_id, accounts, choice, salt)
        },
        RPSInstruction::ResolveTimeout => {
            process_resolve_timeout(program_id, accounts)
        },
        RPSInstruction::ClaimWinnings => {
            process_claim_winnings(program_id, accounts)
        },
        RPSInstruction::RejoinGame => {
            process_rejoin_game(program_id, accounts)
        },
        RPSInstruction::StartNewGameRound => {
            process_start_new_game_round(program_id, accounts)
        },
        RPSInstruction::AutoPlayNextRound => {
            process_auto_play_next_round(program_id, accounts)
        },
        RPSInstruction::AddBotPlayers { count } => {
            process_add_bot_players(program_id, accounts, count)
        },
    }
}

// Implementation for initializing a new game
fn process_initialize_game(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    min_players: u8,
    max_players: u8,
    total_rounds: u8,
    entry_fee: u64,
    timeout_seconds: u64,
    losers_can_rejoin: bool,
    game_mode: u8,
    currency_mode: u8,
    auto_round_delay: u64,
    max_auto_rounds: u64,
    game_variant: u8,
    time_limit: Option<u64>,
    chat_enabled: bool,
    nft_prize: bool,
    tournament_id: Option<Pubkey>,
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();

    let initializer = next_account_info(accounts_iter)?;
    let game_account = next_account_info(accounts_iter)?;
    let system_program = next_account_info(accounts_iter)?;

    // Ensure the initializer signed the transaction
    if !initializer.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    // Validate parameters - ensure only 3 or 4 players
    if min_players != 3 || (max_players != 3 && max_players != 4) || min_players > max_players {
        return Err(ProgramError::InvalidArgument);
    }

    if total_rounds == 0 {
        return Err(ProgramError::InvalidArgument);
    }

    // Parse game mode
    let game_mode = match game_mode {
        0 => GameMode::Manual,
        1 => GameMode::Automated,
        _ => return Err(ProgramError::InvalidArgument),
    };

    // Parse currency mode
    let currency_mode = match currency_mode {
        0 => CurrencyMode::SOL,
        1 => CurrencyMode::RPSToken,
        _ => return Err(ProgramError::InvalidArgument),
    };

    // Create game account
    let rent = Rent::get()?;
    let rent_lamports = rent.minimum_balance(Game::get_max_size(max_players));

    invoke(
        &system_instruction::create_account(
            initializer.key,
            game_account.key,
            rent_lamports,
            Game::get_max_size(max_players) as u64,
            program_id,
        ),
        &[initializer.clone(), game_account.clone(), system_program.clone()],
    )?;

    // Initialize host as first player
    let mut players = Vec::new();
    players.push(Player {
        pubkey: *initializer.key,
        choice: Choice::None,
        committed_choice: [0; 32],
        revealed: false,
        score: 0,
    });

    // Initialize game state
    let clock = Clock::get()?;

    // Randomly choose the actual player count (either 3 or 4)
    let player_count = if min_players == max_players {
        min_players
    } else {
        // Use the last bit of the timestamp as randomness
        // This is not cryptographically secure but sufficient for this purpose
        if (clock.unix_timestamp & 1) == 0 { 3 } else { 4 }
    };

    // Convert game_variant from u8 to GameVariant enum
    let game_variant_enum = match game_variant {
        0 => GameVariant::Classic,
        1 => GameVariant::Extended,
        2 => GameVariant::Timed,
        3 => GameVariant::Streak,
        4 => GameVariant::Tournament,
        _ => GameVariant::Classic, // Default to Classic
    };

    // Convert game_mode from u8 to GameMode enum
    let game_mode_enum = match game_mode {
        0 => GameMode::Manual,
        1 => GameMode::Automated,
        _ => GameMode::Manual, // Default to Manual
    };

    // Convert currency_mode from u8 to CurrencyMode enum
    let currency_mode_enum = match currency_mode {
        0 => CurrencyMode::SOL,
        1 => CurrencyMode::RPSToken,
        _ => CurrencyMode::SOL, // Default to SOL
    };

    let game = Game {
        host: *initializer.key,
        players,
        min_players,
        max_players,
        state: GameState::WaitingForPlayers,
        current_round: 1,
        total_rounds,
        entry_fee,
        game_pot: entry_fee, // Host pays entry fee
        required_timeout: timeout_seconds,
        last_action_timestamp: clock.unix_timestamp as u64,
        player_count,
        losers_can_rejoin,
        game_mode: game_mode_enum,
        auto_round_delay,
        max_auto_rounds,
        current_auto_round: 0,
        currency_mode: currency_mode_enum,
        game_variant: game_variant_enum,
        time_limit,
        spectators: Vec::new(),
        chat_enabled,
        tournament_id,
        nft_prize,
    };

    // Save game state to account
    game.serialize(&mut *game_account.data.borrow_mut())?;

    // Transfer entry fee from initializer to game account
    if entry_fee > 0 && matches!(currency_mode, CurrencyMode::SOL) {
        invoke(
            &system_instruction::transfer(
                initializer.key,
                game_account.key,
                entry_fee,
            ),
            &[initializer.clone(), game_account.clone(), system_program.clone()],
        )?;
    }

    // If using RPS tokens, would handle token transfers here

    msg!("Game initialized with ID: {}", game_account.key);
    Ok(())
}

// Implementation for joining a game
fn process_join_game(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();

    let player = next_account_info(accounts_iter)?;
    let game_account = next_account_info(accounts_iter)?;
    let system_program = next_account_info(accounts_iter)?;

    // Ensure the player signed the transaction
    if !player.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    // Load game state
    let mut game = Game::try_from_slice(&game_account.data.borrow())?;

    // Check if game is in correct state
    if game.state != GameState::WaitingForPlayers {
        return Err(ProgramError::InvalidAccountData);
    }

    // Check if player already joined
    for existing_player in &game.players {
        if existing_player.pubkey == *player.key {
            return Err(ProgramError::InvalidArgument);
        }
    }

    // Check if game is full based on the randomized player_count
    if game.players.len() >= game.player_count as usize {
        return Err(ProgramError::InvalidArgument);
    }

    // Add player to the game
    game.players.push(Player {
        pubkey: *player.key,
        choice: Choice::None,
        committed_choice: [0; 32],
        revealed: false,
        score: 0,
    });

    // Update game pot
    game.game_pot += game.entry_fee;

    // Update game state if required player count is reached
    if game.players.len() >= game.player_count as usize {
        game.state = GameState::CommitPhase;
        msg!("Required player count reached: {}", game.player_count);
    }

    // Update last action timestamp
    let clock = Clock::get()?;
    game.last_action_timestamp = clock.unix_timestamp as u64;

    // Save game state
    game.serialize(&mut *game_account.data.borrow_mut())?;

    // Transfer entry fee
    if game.entry_fee > 0 {
        invoke(
            &system_instruction::transfer(
                player.key,
                game_account.key,
                game.entry_fee,
            ),
            &[player.clone(), game_account.clone(), system_program.clone()],
        )?;
    }

    msg!("Player joined game: {}", player.key);

    Ok(())
}

// Implementation for committing a choice (hash of choice + salt)
fn process_commit_choice(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    committed_choice: [u8; 32],
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();

    let player = next_account_info(accounts_iter)?;
    let game_account = next_account_info(accounts_iter)?;

    // Ensure the player signed the transaction
    if !player.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    // Load game state
    let mut game = Game::try_from_slice(&game_account.data.borrow())?;

    // Check if game is in correct state
    if game.state != GameState::CommitPhase {
        return Err(ProgramError::InvalidAccountData);
    }

    // Find player and update their committed choice
    let mut player_found = false;
    for game_player in &mut game.players {
        if game_player.pubkey == *player.key {
            game_player.committed_choice = committed_choice;
            player_found = true;
            break;
        }
    }

    if !player_found {
        return Err(ProgramError::InvalidArgument);
    }

    // Check if all players have committed and transition to reveal phase if so
    let all_committed = game.players.iter().all(|p| p.committed_choice != [0; 32]);

    if all_committed {
        game.state = GameState::RevealPhase;
    }

    // Update last action timestamp
    let clock = Clock::get()?;
    game.last_action_timestamp = clock.unix_timestamp as u64;

    // Save game state
    game.serialize(&mut *game_account.data.borrow_mut())?;

    msg!("Player committed choice: {}", player.key);

    Ok(())
}

// Implementation for revealing a choice
fn process_reveal_choice(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    choice: Choice,
    salt: [u8; 32],
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();

    let player = next_account_info(accounts_iter)?;
    let game_account = next_account_info(accounts_iter)?;

    // Ensure the player signed the transaction
    if !player.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    // Load game state
    let mut game = Game::try_from_slice(&game_account.data.borrow())?;

    // Check if game is in correct state
    if game.state != GameState::RevealPhase {
        return Err(ProgramError::InvalidAccountData);
    }

    // Find player's index and verify the commit matches reveal
    let mut player_index = None;
    for (i, game_player) in game.players.iter().enumerate() {
        if game_player.pubkey == *player.key {
            player_index = Some(i);

            // Verify that the revealed choice matches the committed choice
            let mut hash_input = [0u8; 64];
            hash_input[0..32].copy_from_slice(&salt);
            // Serialize choice into bytes and add to hash input
            let choice_bytes = match choice {
                Choice::Rock => 1u8,
                Choice::Paper => 2u8,
                Choice::Scissors => 3u8,
                Choice::None => return Err(ProgramError::InvalidArgument),
            };
            hash_input[32] = choice_bytes;

            let hash = solana_program::hash::hash(&hash_input).to_bytes();

            if hash != game_player.committed_choice {
                return Err(ProgramError::InvalidArgument);
            }

            break;
        }
    }

    let player_index = player_index.ok_or(ProgramError::InvalidArgument)?;

    // Update player's choice and revealed status
    game.players[player_index].choice = choice;
    game.players[player_index].revealed = true;

    // Check if all players have revealed and process round if so
    let all_revealed = game.players.iter().all(|p| p.revealed);

    if all_revealed {
        // Calculate round winners using the game_logic module
        game_logic::process_round_results(&mut game);

        // Check if game should end
        if game.current_round >= game.total_rounds {
            game.state = GameState::Finished;
        } else {
            // Reset for next round
            game.current_round += 1;
            game.state = GameState::CommitPhase;

            // Reset player choices for next round
            for player in &mut game.players {
                player.choice = Choice::None;
                player.committed_choice = [0; 32];
                player.revealed = false;
            }
        }
    }

    // Update last action timestamp
    let clock = Clock::get()?;
    game.last_action_timestamp = clock.unix_timestamp as u64;

    // Save game state
    game.serialize(&mut *game_account.data.borrow_mut())?;

    msg!("Player revealed choice: {}", player.key);

    Ok(())
}

// Implementation for resolving timeouts
fn process_resolve_timeout(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();

    let caller = next_account_info(accounts_iter)?;
    let game_account = next_account_info(accounts_iter)?;

    // Ensure the caller signed the transaction
    if !caller.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    // Load game state
    let mut game = Game::try_from_slice(&game_account.data.borrow())?;

    // Check if timeout has occurred
    let clock = Clock::get()?;
    let current_time = clock.unix_timestamp as u64;
    let time_elapsed = current_time.saturating_sub(game.last_action_timestamp);

    if time_elapsed < game.required_timeout {
        return Err(ProgramError::InvalidArgument);
    }

    // Process timeout based on current game state
    match game.state {
        GameState::WaitingForPlayers => {
            // Refund entry fees and end game
            // (Simplified - would need additional accounts for refunds)
            game.state = GameState::Finished;
        },
        GameState::CommitPhase => {
            // Remove players who didn't commit and continue
            let committed_players: Vec<Player> = game.players
                .iter()
                .filter(|p| p.committed_choice != [0; 32])
                .cloned()
                .collect();

            if committed_players.len() >= game.min_players as usize {
                game.players = committed_players;
                game.state = GameState::RevealPhase;
            } else {
                // Not enough players committed, end game
                game.state = GameState::Finished;
            }
        },
        GameState::RevealPhase => {
            // Process round with revealed choices only
            // Players who didn't reveal get a default loss

            for player in &mut game.players {
                if !player.revealed {
                    player.choice = Choice::None;
                    player.revealed = true;
                }
            }

            // Calculate round winners using the game_logic module
            game_logic::process_round_results(&mut game);

            // Check if game should end
            if game.current_round >= game.total_rounds {
                game.state = GameState::Finished;
            } else {
                // Reset for next round
                game.current_round += 1;
                game.state = GameState::CommitPhase;

                // Reset player choices for next round
                for player in &mut game.players {
                    player.choice = Choice::None;
                    player.committed_choice = [0; 32];
                    player.revealed = false;
                }
            }
        },
        GameState::Finished => {
            return Err(ProgramError::InvalidAccountData);
        },
    }

    // Update last action timestamp
    game.last_action_timestamp = current_time;

    // Save game state
    game.serialize(&mut *game_account.data.borrow_mut())?;

    msg!("Timeout resolved");

    Ok(())
}

// Implementation for claiming winnings
fn process_claim_winnings(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();

    let winner = next_account_info(accounts_iter)?;
    let game_account = next_account_info(accounts_iter)?;
    let system_program = next_account_info(accounts_iter)?;

    // Ensure the winner signed the transaction
    if !winner.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    // Load game state
    let mut game = Game::try_from_slice(&game_account.data.borrow())?;

    // Check if game is finished
    if game.state != GameState::Finished {
        return Err(ProgramError::InvalidAccountData);
    }

    // Find the winner(s) - those with highest score
    let mut max_score = 0;
    for player in &game.players {
        if player.score > max_score {
            max_score = player.score;
        }
    }

    let winners: Vec<&Player> = game.players
        .iter()
        .filter(|p| p.score == max_score)
        .collect();

    // Check if caller is among winners
    let caller_is_winner = winners.iter().any(|p| p.pubkey == *winner.key);

    if !caller_is_winner {
        return Err(ProgramError::InvalidArgument);
    }

    // Calculate winner's share - all winners take equal share of the pot
    let winner_share = game.game_pot / winners.len() as u64;

    // Transfer winner's share
    let game_key = game_account.key;
    let seeds = &[b"rps_game", game_key.as_ref(), &[1]];
    let (_pda, bump) = Pubkey::find_program_address(seeds, program_id);
    let signer_seeds = &[b"rps_game", game_key.as_ref(), &[bump][..]];

    invoke_signed(
        &system_instruction::transfer(
            game_account.key,
            winner.key,
            winner_share,
        ),
        &[game_account.clone(), winner.clone(), system_program.clone()],
        &[signer_seeds],
    )?;

    // Mark player as paid
    for player in &mut game.players {
        if player.pubkey == *winner.key {
            player.score = 0; // Set to 0 to prevent double claiming
            break;
        }
    }

    // Save game state
    game.serialize(&mut *game_account.data.borrow_mut())?;

    msg!("Winnings claimed by: {}", winner.key);

    Ok(())
}

// Implementation for rejoining a game as a loser
fn process_rejoin_game(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();

    let player = next_account_info(accounts_iter)?;
    let game_account = next_account_info(accounts_iter)?;
    let system_program = next_account_info(accounts_iter)?;

    // Ensure the player signed the transaction
    if !player.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    // Load game state
    let mut game = Game::try_from_slice(&game_account.data.borrow())?;

    // Check if game is in correct state and losers can rejoin
    if game.state != GameState::Finished || !game.losers_can_rejoin {
        return Err(ProgramError::InvalidAccountData);
    }

    // Check if player was a loser in the previous game
    let mut was_player = false;
    let mut was_loser = false;
    let max_score = game.players.iter().map(|p| p.score).max().unwrap_or(0);

    for player_data in &game.players {
        if player_data.pubkey == *player.key {
            was_player = true;
            if player_data.score < max_score {
                was_loser = true;
            }
            break;
        }
    }

    if !was_player || !was_loser {
        return Err(ProgramError::InvalidArgument);
    }

    // Transfer entry fee
    if game.entry_fee > 0 {
        invoke(
            &system_instruction::transfer(
                player.key,
                game_account.key,
                game.entry_fee,
            ),
            &[player.clone(), game_account.clone(), system_program.clone()],
        )?;

        // Update game pot
        game.game_pot += game.entry_fee;
    }

    // Reset this player's stats for the next game
    for player_data in &mut game.players {
        if player_data.pubkey == *player.key {
            player_data.choice = Choice::None;
            player_data.committed_choice = [0; 32];
            player_data.revealed = false;
            break;
        }
    }

    // Update last action timestamp
    let clock = Clock::get()?;
    game.last_action_timestamp = clock.unix_timestamp as u64;

    // Save game state
    game.serialize(&mut *game_account.data.borrow_mut())?;

    msg!("Player rejoined game: {}", player.key);

    Ok(())
}

// Implementation for starting a new game round with the same players
fn process_start_new_game_round(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();

    let initiator = next_account_info(accounts_iter)?;
    let game_account = next_account_info(accounts_iter)?;

    // Ensure the initiator signed the transaction
    if !initiator.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    // Load game state
    let mut game = Game::try_from_slice(&game_account.data.borrow())?;

    // Check if game is in finished state
    if game.state != GameState::Finished {
        return Err(ProgramError::InvalidAccountData);
    }

    // Check if initiator is host or a player
    let is_participant = game.host == *initiator.key ||
        game.players.iter().any(|p| p.pubkey == *initiator.key);

    if !is_participant {
        return Err(ProgramError::InvalidArgument);
    }

    // Reset game state for a new round
    game.current_round = 1;
    game.state = GameState::CommitPhase;

    // Potentially randomize player count again for the new game
    let clock = Clock::get()?;
    if game.min_players != game.max_players {
        game.player_count = if (clock.unix_timestamp & 1) == 0 { 3 } else { 4 };
    }

    // Reset all players
    for player in &mut game.players {
        player.choice = Choice::None;
        player.committed_choice = [0; 32];
        player.revealed = false;
        player.score = 0;
    }

    // Update last action timestamp
    game.last_action_timestamp = clock.unix_timestamp as u64;

    // Save game state
    game.serialize(&mut *game_account.data.borrow_mut())?;

    msg!("New game round started");

    Ok(())
}

// Implementation for auto-playing the next round
fn process_auto_play_next_round(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();

    let initiator = next_account_info(accounts_iter)?;
    let game_account = next_account_info(accounts_iter)?;

    // Ensure the initiator signed the transaction
    if !initiator.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    // Load game state
    let mut game = Game::try_from_slice(&game_account.data.borrow())?;

    // Check if game is in automated mode
    if !matches!(game.game_mode, GameMode::Automated) {
        return Err(ProgramError::InvalidAccountData);
    }

    // Check if game is in finished state
    if !matches!(game.state, GameState::Finished) {
        return Err(ProgramError::InvalidAccountData);
    }

    // Check if we've reached the maximum number of auto rounds
    if game.current_auto_round >= game.max_auto_rounds {
        return Err(ProgramError::InvalidAccountData);
    }

    // Check if initiator is host or a player
    let is_participant = game.host == *initiator.key ||
        game.players.iter().any(|p| p.pubkey == *initiator.key);

    if !is_participant {
        return Err(ProgramError::InvalidArgument);
    }

    // Reset game state for a new round
    game.current_round = 1;
    game.state = GameState::CommitPhase;
    game.current_auto_round += 1;

    // Potentially randomize player count again for the new game
    let clock = Clock::get()?;
    if game.min_players != game.max_players {
        game.player_count = if (clock.unix_timestamp & 1) == 0 { 3 } else { 4 };
    }

    // Reset all players
    for player in &mut game.players {
        player.choice = Choice::None;
        player.committed_choice = [0; 32];
        player.revealed = false;
        player.score = 0;
    }

    // Update last action timestamp
    game.last_action_timestamp = clock.unix_timestamp as u64;

    // Save game state
    game.serialize(&mut *game_account.data.borrow_mut())?;

    msg!("New automated game round started");

    Ok(())
}

// Implementation for adding bot players
fn process_add_bot_players(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    count: u8,
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();

    let initiator = next_account_info(accounts_iter)?;
    let game_account = next_account_info(accounts_iter)?;
    let system_program = next_account_info(accounts_iter)?;

    // Ensure the initiator signed the transaction
    if !initiator.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    // Load game state
    let mut game = Game::try_from_slice(&game_account.data.borrow())?;

    // Check if game is in correct state
    if !matches!(game.state, GameState::WaitingForPlayers) {
        return Err(ProgramError::InvalidAccountData);
    }

    // Check if there's room for bot players
    let available_slots = game.player_count as usize - game.players.len();
    let bot_count = std::cmp::min(count as usize, available_slots);

    if bot_count == 0 {
        return Err(ProgramError::InvalidArgument);
    }

    // Add bot players
    for i in 0..bot_count {
        // Create a deterministic bot pubkey based on game account and index
        let seed = format!("bot_{}_{}_{}", game_account.key, game.players.len(), i);
        let bot_pubkey = Pubkey::new(seed.as_bytes());

        game.players.push(Player {
            pubkey: bot_pubkey,
            choice: Choice::None,
            committed_choice: [0; 32],
            revealed: false,
            score: 0,
        });

        // Update game pot for bot players - simulate them paying entry fee
        game.game_pot += game.entry_fee;

        msg!("Added bot player: {}", bot_pubkey);
    }

    // Update game state if required player count is reached
    if game.players.len() >= game.player_count as usize {
        game.state = GameState::CommitPhase;
        msg!("Required player count reached: {}", game.player_count);
    }

    // Update last action timestamp
    let clock = Clock::get()?;
    game.last_action_timestamp = clock.unix_timestamp as u64;

    // Save game state
    game.serialize(&mut *game_account.data.borrow_mut())?;

    msg!("Added {} bot players", bot_count);

    Ok(())
}

// Helper function to process round results
fn process_round_results(game: &mut Game) {
    let player_count = game.players.len();

    // For each player, compare against every other player
    for i in 0..player_count {
        for j in (i+1)..player_count {
            let choice_i = &game.players[i].choice;
            let choice_j = &game.players[j].choice;

            match (choice_i, choice_j) {
                (Choice::Rock, Choice::Scissors) |
                (Choice::Paper, Choice::Rock) |
                (Choice::Scissors, Choice::Paper) => {
                    // Player i wins against player j
                    game.players[i].score += 1;
                },
                (Choice::Scissors, Choice::Rock) |
                (Choice::Rock, Choice::Paper) |
                (Choice::Paper, Choice::Scissors) => {
                    // Player j wins against player i
                    game.players[j].score += 1;
                },
                _ => {
                    // Tie or invalid choices - no points awarded
                }
            }
        }
    }
}

// Helper methods for Game struct
impl Game {
    pub fn get_max_size(max_players: u8) -> usize {
        // Calculate max size needed for serialized Game struct with max_players
        // This is a rough estimate - actual implementation would need precise calculation
        8 + // host pubkey
        4 + (max_players as usize * 32 + 1 + 32 + 1 + 1) + // Vector of Player structs
        1 + // min_players
        1 + // max_players
        1 + // game state
        1 + // current_round
        1 + // total_rounds
        8 + // entry_fee
        8 + // game_pot
        8 + // required_timeout
        8 + // last_action_timestamp
        1 + // player_count
        1 + // losers_can_rejoin
        1 + // game_mode
        8 + // auto_round_delay
        8 + // max_auto_rounds
        8 + // current_auto_round
        1 + // currency_mode
        1 + // game_variant
        9 + // time_limit (Option<u64>)
        4 + (max_players as usize * 32) + // spectators (Vec<Pubkey>)
        1 + // chat_enabled
        33 + // tournament_id (Option<Pubkey>)
        1   // nft_prize
    }
}
