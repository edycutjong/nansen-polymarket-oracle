/**
 * Known Smart Money wallets on Polymarket — extracted from real Nansen API data.
 *
 * These addresses hold $1M+ aggregate positions across markets.
 * Used as a fallback when the profiler endpoint is unavailable (insufficient credits).
 *
 * Map: address (lowercase) → { label, fullname }
 */

import type { WalletLabel } from '../types/smartmoney.js';

export interface KnownWallet {
  label: string;
  fullname: string;
}

/**
 * Top Polymarket whale wallets — all with $1M+ total positions.
 * Addresses are lowercased for case-insensitive matching.
 */
export const KNOWN_SM_WALLETS: Record<string, KnownWallet> = {
  // $9.5M — Largest Polymarket whale
  '0x50c8c52ca63217fdbfb33d671932c8a84caeda27': { label: 'Smart Trader', fullname: 'PM Whale Alpha' },
  // $8.3M
  '0x48b08b27e06094f8436cb91e19a4b6f5f4089509': { label: 'Smart Trader', fullname: 'PM Whale Beta' },
  // $7.6M
  '0x61d88e3d81dff96bf843a5c0c58e663041ad8cdd': { label: 'Smart Trader', fullname: 'PM Whale Gamma' },
  // $6.0M
  '0xcedf2eb27881ef6de73a13e6315b2e8d0c6b78c2': { label: 'Smart Trader', fullname: 'PM Whale Delta' },
  // $5.7M
  '0x359415acb3dfd763a63f7016ca81955d830cd7a8': { label: 'Smart Trader', fullname: 'PM Whale Epsilon' },
  // $5.4M
  '0x07b0e21ff4a623c20a9042ab89c9641dedfcf528': { label: 'Smart Trader', fullname: 'PM Whale Zeta' },
  // $5.0M
  '0x864e996c3143026b6c230945dd917de1922347b3': { label: 'Fund', fullname: 'PM Fund Alpha' },
  // $4.5M
  '0xe72fb9d3ea7a176543d5e448b53c62cd6c72d9e8': { label: 'Fund', fullname: 'PM Fund Beta' },
  // $4.0M
  '0x7c9063122c01837fe83da2521056e10c9b6dd129': { label: 'Smart Trader', fullname: 'PM Whale Eta' },
  // $3.9M
  '0x4d2352dd1719fac358b1c3132ad3779cb76da28c': { label: 'Smart Trader', fullname: 'PM Whale Theta' },
  // $2.3M
  '0xb239159f41cd8f79d0e71be753d6988c6b501ee6': { label: 'Smart Trader', fullname: 'PM Whale Iota' },
  // $2.1M
  '0xfe681735ac7f6a171f221bfc7ca2c344a98fba73': { label: 'Smart Trader', fullname: 'PM Whale Kappa' },
  // $1.8M
  '0x18f120e8d3929f4ba2147ac5781cc86c2bd9ffb0': { label: 'Fund', fullname: 'PM Fund Gamma' },
  // $1.6M
  '0xe1f4514ed0f07f2a395aec1ded286ebcb3a96f32': { label: 'Smart Trader', fullname: 'PM Whale Lambda' },
  // $1.6M
  '0xfb827bc9ccb5cffd878d9572009fc507b33aae65': { label: 'Smart Trader', fullname: 'PM Whale Mu' },
  // $1.5M
  '0x8640a770436b418149544b37f1e156a095b9ce48': { label: '90D Smart Trader', fullname: 'PM Whale Nu' },
  // $1.5M
  '0x05b33f304ae623709832ee7fcc7de9dc5692e59a': { label: '90D Smart Trader', fullname: 'PM Whale Xi' },
  // $1.5M
  '0x9f07dc88dc450978e5ddf973f6a0236a7cfbf99a': { label: 'Smart Trader', fullname: 'PM Whale Omicron' },
  // $1.4M
  '0xc2df191521b58fef0e903f6413c62136b4891a99': { label: 'Smart Trader', fullname: 'PM Whale Pi' },
  // $1.4M
  '0x4c8bffc577677ffbe641a13d58ab0bacc79ef265': { label: 'Fund', fullname: 'PM Fund Delta' },
  // $1.3M
  '0x84003925fb27be5f45e53baa3f8ebfe16485d887': { label: '30D Smart Trader', fullname: 'PM Whale Rho' },
  // $1.2M
  '0xd10b00a18802ff604c5aaa9ce3fc4e99221a2c6e': { label: 'Smart Trader', fullname: 'PM Whale Sigma' },
  // $1.2M
  '0x17fd03969575d46238cdd3a039a7793731545642': { label: 'Smart Trader', fullname: 'PM Whale Tau' },
  // $1.2M
  '0x8d609e32b8c915a79961d982692f7759bbfef19d': { label: '180D Smart Trader', fullname: 'PM Whale Upsilon' },
  // $1.2M
  '0x4879a9d9be67a2958d67e2171d99ef77e30bd4c5': { label: 'Smart Trader', fullname: 'PM Whale Phi' },
  // $1.1M
  '0xbe492e66494f051e0d7d0db8d4a71c1f90081032': { label: 'Smart Trader', fullname: 'PM Whale Chi' },
  // $1.1M
  '0x32324e483e2892771314ba6bdf12374b5282a417': { label: 'Fund', fullname: 'PM Fund Epsilon' },
  // $1.1M
  '0xe5c3a3bad46475dd53100cdbecb0a7541aba0391': { label: 'Smart Trader', fullname: 'PM Whale Psi' },
  // $1.0M
  '0xb3d9bf78226cf1104e8eb184d9e77d5f6ef79ced': { label: 'Smart Trader', fullname: 'PM Whale Omega' },
  // $1.0M
  '0x11c4a59b65493c9b8debdc2a309ec14bb5379666': { label: '30D Smart Trader', fullname: 'PM Whale Alpha-2' },
};

/**
 * Look up an address in the known-wallets registry.
 * Returns the wallet label if found, or null.
 */
export function lookupKnownWallet(address: string): WalletLabel | null {
  const entry = KNOWN_SM_WALLETS[address.toLowerCase()];
  if (!entry) return null;
  return {
    label: entry.label,
    fullname: entry.fullname,
  } as WalletLabel;
}
