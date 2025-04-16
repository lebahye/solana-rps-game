use solana_program::{
    account_info::AccountInfo,
    entrypoint,
    entrypoint::ProgramResult,
    pubkey::Pubkey,
    program_error::ProgramError,
};

#[derive(Debug)]
pub enum GameError {
    InvalidInstruction,
}

entrypoint!(process_instruction);

pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8]
) -> ProgramResult {
    // Basic implementation
    if instruction_data.is_empty() {
        return Err(ProgramError::InvalidInstructionData);
    }
    Ok(())
}
