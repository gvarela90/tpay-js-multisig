export const MULTISIG_APPLICATION = [2, 3];
export const COINS = 100000000;
export const PARTIAL_TXN_HEADER_MAGIC = '45505446ff';
// Value used for fee estimation (satoshis per kilobyte)
export const FEE_PER_KB = 100000;
// Safe upper bound for change address script size in bytes
export const MIN_RELAY_TX_FEE = 0.0001 * COINS;
export const MIN_TXOUT_AMOUNT = MIN_RELAY_TX_FEE;
export const ADDRESS_TYPE = 'p2sh';
