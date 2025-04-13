export const formatSOL = (amount: number): string => {
  return (amount / 1e9).toFixed(4);
};