use crate::{Choice, GameVariant};

// Determine if player1 wins against player2
pub fn determine_winner(player1_choice: &Choice, player2_choice: &Choice, game_variant: &GameVariant) -> bool {
    // If either player didn't make a choice, they lose
    if matches!(player1_choice, Choice::None) {
        return false;
    }
    if matches!(player2_choice, Choice::None) {
        return true;
    }

    // If both players made the same choice, it's a tie (return false)
    if player1_choice == player2_choice {
        return false;
    }

    match game_variant {
        GameVariant::Classic => {
            // Classic Rock-Paper-Scissors logic
            match (player1_choice, player2_choice) {
                // Rock beats Scissors
                (Choice::Rock, Choice::Scissors) => true,
                // Paper beats Rock
                (Choice::Paper, Choice::Rock) => true,
                // Scissors beats Paper
                (Choice::Scissors, Choice::Paper) => true,
                // All other combinations are losses
                _ => false,
            }
        },
        GameVariant::Extended => {
            // Extended Rock-Paper-Scissors-Lizard-Spock logic
            match (player1_choice, player2_choice) {
                // Rock beats Scissors and Lizard
                (Choice::Rock, Choice::Scissors) | (Choice::Rock, Choice::Lizard) => true,
                // Paper beats Rock and Spock
                (Choice::Paper, Choice::Rock) | (Choice::Paper, Choice::Spock) => true,
                // Scissors beats Paper and Lizard
                (Choice::Scissors, Choice::Paper) | (Choice::Scissors, Choice::Lizard) => true,
                // Lizard beats Paper and Spock
                (Choice::Lizard, Choice::Paper) | (Choice::Lizard, Choice::Spock) => true,
                // Spock beats Rock and Scissors
                (Choice::Spock, Choice::Rock) | (Choice::Spock, Choice::Scissors) => true,
                // All other combinations are losses
                _ => false,
            }
        },
        // For other variants, use the classic rules
        _ => determine_winner(player1_choice, player2_choice, &GameVariant::Classic),
    }
}

// Process round results and update player scores
pub fn process_round_results(game: &mut crate::Game) {
    let players = &mut game.players;
    let player_count = players.len();
    
    // Skip if there are fewer than 2 players
    if player_count < 2 {
        return;
    }

    // Create a matrix to track wins
    let mut win_matrix = vec![vec![false; player_count]; player_count];
    
    // Compare each player's choice against every other player
    for i in 0..player_count {
        for j in 0..player_count {
            if i != j {
                win_matrix[i][j] = determine_winner(
                    &players[i].choice, 
                    &players[j].choice,
                    &game.game_variant
                );
            }
        }
    }
    
    // Count wins for each player
    let mut win_counts = vec![0; player_count];
    for i in 0..player_count {
        for j in 0..player_count {
            if win_matrix[i][j] {
                win_counts[i] += 1;
            }
        }
    }
    
    // Update player scores based on win counts
    for i in 0..player_count {
        players[i].score += win_counts[i] as u8;
    }
}
