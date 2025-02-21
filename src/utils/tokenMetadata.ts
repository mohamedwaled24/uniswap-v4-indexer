import { createPublicClient, http, getContract, type PublicClient } from "viem";
import { mainnet } from "viem/chains";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { ADDRESS_ZERO } from "./constants";
import { getChainConfig } from "./chains";
import * as dotenv from "dotenv";

dotenv.config();

const ERC20_ABI = [
  {
    inputs: [],
    name: "name",
    outputs: [{ type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "NAME",
    outputs: [{ type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "SYMBOL",
    outputs: [{ type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

const CACHE_PATH = join(__dirname, "../../tokenMetadata.json");

interface TokenMetadata {
  name: string;
  symbol: string;
  decimals: number;
}

const getRpcUrl = (chainId: number): string => {
  switch (chainId) {
    case 1:
      return process.env.MAINNET_RPC_URL || "";
    default:
      throw new Error(`No RPC URL configured for chainId ${chainId}`);
  }
};

const client = createPublicClient({
  chain: mainnet,
  transport: http(getRpcUrl(1)), // Default to mainnet for now
});

let metadataCache: Record<string, TokenMetadata> = {};

// Load cache from file
if (existsSync(CACHE_PATH)) {
  try {
    metadataCache = JSON.parse(readFileSync(CACHE_PATH, "utf8"));
  } catch (e) {
    console.error("Error loading token metadata cache:", e);
  }
}

export async function getTokenMetadata(
  address: string
): Promise<TokenMetadata> {
  // Handle native token
  if (address.toLowerCase() === ADDRESS_ZERO.toLowerCase()) {
    const chainConfig = getChainConfig(1); // TODO: Pass chainId
    return {
      name: chainConfig.nativeTokenDetails.name,
      symbol: chainConfig.nativeTokenDetails.symbol,
      decimals: Number(chainConfig.nativeTokenDetails.decimals),
    };
  }

  if (metadataCache[address]) {
    return metadataCache[address];
  }

  try {
    const contract = getContract({
      address: address as `0x${string}`,
      abi: ERC20_ABI,
      client,
    });

    let name: string, symbol: string, decimals: number;

    try {
      name = await contract.read.name();
    } catch {
      try {
        const bytes32Name = await contract.read.NAME();
        name = new TextDecoder().decode(
          new Uint8Array(
            Buffer.from(bytes32Name.slice(2), "hex").filter((n) => n !== 0)
          )
        );
      } catch {
        name = "unknown";
      }
    }

    try {
      symbol = await contract.read.symbol();
    } catch {
      try {
        const bytes32Symbol = await contract.read.SYMBOL();
        symbol = new TextDecoder().decode(
          new Uint8Array(
            Buffer.from(bytes32Symbol.slice(2), "hex").filter((n) => n !== 0)
          )
        );
      } catch {
        symbol = "UNKNOWN";
      }
    }

    try {
      decimals = await contract.read.decimals();
    } catch {
      decimals = 18; // Default to 18 if we can't get decimals
    }

    const metadata = { name, symbol, decimals };

    // Update cache
    metadataCache[address] = metadata;
    writeFileSync(CACHE_PATH, JSON.stringify(metadataCache, null, 2));

    return metadata;
  } catch (e) {
    console.error(`Error fetching metadata for ${address}:`, e);
    throw e;
  }
}
