import { BigDecimal } from "generated";
import { t as mockDb } from "generated/src/TestHelpers_MockDb.gen";
import {
  WETH_MAINNET_ADDRESS,
  USDC_MAINNET_ADDRESS,
} from "./constants";

interface TokenMetadata {
  symbol: string;
  name: string;
  decimals: number;
}

interface TokenInitParams {
  address: string;
  chainId?: string;
  metadata: TokenMetadata;
  derivedETH?: string;
  totalValueLocked?: string;
  totalValueLockedUSD?: string;
  whitelistPools?: string[];
}

/**
 * Creates and initializes a Token entity for testing with sensible defaults
 */
export function createTestToken(
  mockDb: mockDb,
  params: TokenInitParams
) {
  const chainIdStr = params.chainId || "1";
  const id = `${chainIdStr}_${params.address}`;

  return mockDb.entities.Token.set({
    id,
    chainId: BigInt(chainIdStr),
    symbol: params.metadata.symbol,
    name: params.metadata.name,
    decimals: BigInt(params.metadata.decimals),
    totalSupply: BigInt(0),
    volume: new BigDecimal("0"),
    volumeUSD: new BigDecimal("0"),
    untrackedVolumeUSD: new BigDecimal("0"),
    feesUSD: new BigDecimal("0"),
    txCount: BigInt(0),
    poolCount: BigInt(1),
    totalValueLocked: new BigDecimal(params.totalValueLocked || "0"),
    totalValueLockedUSD: new BigDecimal(params.totalValueLockedUSD || "0"),
    totalValueLockedUSDUntracked: new BigDecimal("0"),
    derivedETH: new BigDecimal(params.derivedETH || "0"),
    whitelistPools: params.whitelistPools || [],
  });
}

// Predefined token metadata
export const WETH_METADATA: TokenMetadata = {
  symbol: "WETH",
  name: "Wrapped Ether",
  decimals: 18,
};

export const USDC_METADATA: TokenMetadata = {
  symbol: "USDC",
  name: "USD Coin",
  decimals: 6,
};

/**
 * Creates a standard WETH token with default values
 */
export function createTestWETH(
  mockDb: MockDb,
  params?: Partial<TokenInitParams>
) {
  return createTestToken(mockDb, {
    address: WETH_MAINNET_ADDRESS,
    metadata: WETH_METADATA,
    derivedETH: "1",
    totalValueLocked: "1000",
    totalValueLockedUSD: "1500000",
    ...params,
  });
}

/**
 * Creates a standard USDC token with default values
 */
export function createTestUSDC(
  mockDb: MockDb,
  params?: Partial<TokenInitParams>
) {
  return createTestToken(mockDb, {
    address: USDC_MAINNET_ADDRESS,
    metadata: USDC_METADATA,
    derivedETH: "0",
    totalValueLocked: "1000000",
    totalValueLockedUSD: "1000000",
    ...params,
  });
} 
