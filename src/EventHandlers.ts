/*
 * Please refer to https://docs.envio.dev for a thorough guide on all Envio indexer features
 */
import { PoolManager, Swap, Token, BigDecimal } from "generated";
import { getChainConfig } from "./utils/chains";
import { getNativePriceInUSD } from "./utils/pricing";
import { sqrtPriceX96ToTokenPrices } from "./utils/pricing";

PoolManager.Approval.handler(async ({ event, context }) => {});

PoolManager.Donate.handler(async ({ event, context }) => {});

PoolManager.Initialize.handler(async ({ event, context }) => {
  // First ensure Bundle exists with ID "1"
  let bundle = await context.Bundle.get("1");
  if (!bundle) {
    await context.Bundle.set({
      id: "1",
      ethPriceUSD: new BigDecimal("0"),
    });
  }

  let poolManager = await context.PoolManager.get(
    `${event.chainId}_${event.srcAddress}`
  );
  if (!poolManager) {
    poolManager = {
      id: `${event.chainId}_${event.srcAddress}`,
      chainId: BigInt(event.chainId),
      poolCount: 1n,
      txCount: 0n,
      totalVolumeUSD: new BigDecimal(0),
      totalVolumeETH: new BigDecimal(0),
      totalFeesUSD: new BigDecimal(0),
      totalFeesETH: new BigDecimal(0),
      untrackedVolumeUSD: new BigDecimal(0),
      totalValueLockedUSD: new BigDecimal(0),
      totalValueLockedETH: new BigDecimal(0),
      totalValueLockedUSDUntracked: new BigDecimal(0),
      totalValueLockedETHUntracked: new BigDecimal(0),
      owner: event.srcAddress,
    };
  } else {
    poolManager = {
      ...poolManager,
      poolCount: poolManager.poolCount + 1n,
    };
  }

  // Get chain config for whitelist tokens
  const chainConfig = getChainConfig(Number(event.chainId));

  // Create or get token0
  const token0Id = `${event.chainId}_${event.params.currency0.toLowerCase()}`;
  let token0 = await context.Token.get(token0Id);
  if (!token0) {
    token0 = {
      id: token0Id,
      chainId: BigInt(event.chainId),
      symbol: "", // Placeholder
      name: "", // Placeholder
      decimals: 18n,
      totalSupply: 0n,
      volume: new BigDecimal("0"),
      volumeUSD: new BigDecimal("0"),
      untrackedVolumeUSD: new BigDecimal("0"),
      feesUSD: new BigDecimal("0"),
      txCount: 0n,
      poolCount: 1n,
      totalValueLocked: new BigDecimal("0"),
      totalValueLockedUSD: new BigDecimal("0"),
      totalValueLockedUSDUntracked: new BigDecimal("0"),
      derivedETH: new BigDecimal("0"),
      whitelistPools: [], // Initialize empty array
    };
  } else {
    token0 = {
      ...token0,
      poolCount: token0.poolCount + 1n,
    };
  }

  // Create or get token1
  const token1Id = `${event.chainId}_${event.params.currency1.toLowerCase()}`;
  let token1 = await context.Token.get(token1Id);
  if (!token1) {
    token1 = {
      id: token1Id,
      chainId: BigInt(event.chainId),
      symbol: "", // Placeholder
      name: "", // Placeholder
      decimals: 18n,
      totalSupply: 0n,
      volume: new BigDecimal("0"),
      volumeUSD: new BigDecimal("0"),
      untrackedVolumeUSD: new BigDecimal("0"),
      feesUSD: new BigDecimal("0"),
      txCount: 0n,
      poolCount: 1n,
      totalValueLocked: new BigDecimal("0"),
      totalValueLockedUSD: new BigDecimal("0"),
      totalValueLockedUSDUntracked: new BigDecimal("0"),
      derivedETH: new BigDecimal("0"),
      whitelistPools: [], // Initialize empty array
    };
  } else {
    token1 = {
      ...token1,
      poolCount: token1.poolCount + 1n,
    };
  }

  // Update whitelist pools
  if (
    chainConfig.whitelistTokens.includes(event.params.currency0.toLowerCase())
  ) {
    token1 = {
      ...token1,
      whitelistPools: [
        ...token1.whitelistPools,
        `${event.chainId}_${event.params.id}`,
      ],
    };
  }

  if (
    chainConfig.whitelistTokens.includes(event.params.currency1.toLowerCase())
  ) {
    token0 = {
      ...token0,
      whitelistPools: [
        ...token0.whitelistPools,
        `${event.chainId}_${event.params.id}`,
      ],
    };
  }

  // Get chain config for token details
  const chainConfigTokenDetails = getChainConfig(Number(event.chainId));

  // Calculate initial prices
  const prices = sqrtPriceX96ToTokenPrices(
    event.params.sqrtPriceX96,
    token0,
    token1,
    chainConfigTokenDetails.nativeTokenDetails
  );

  // Create new pool with prices
  const pool = {
    id: `${event.chainId}_${event.params.id}`,
    chainId: BigInt(event.chainId),
    createdAtTimestamp: BigInt(event.block.timestamp),
    createdAtBlockNumber: BigInt(event.block.number),
    token0: token0Id,
    token1: token1Id,
    feeTier: BigInt(event.params.fee),
    liquidity: 0n,
    sqrtPrice: event.params.sqrtPriceX96,
    token0Price: prices[0],
    token1Price: prices[1],
    tick: event.params.tick,
    tickSpacing: BigInt(event.params.tickSpacing),
    observationIndex: 0n,
    volumeToken0: new BigDecimal(0),
    volumeToken1: new BigDecimal(0),
    volumeUSD: new BigDecimal(0),
    untrackedVolumeUSD: new BigDecimal(0),
    feesUSD: new BigDecimal(0),
    txCount: 0n,
    collectedFeesToken0: new BigDecimal(0),
    collectedFeesToken1: new BigDecimal(0),
    collectedFeesUSD: new BigDecimal(0),
    totalValueLockedToken0: new BigDecimal(0),
    totalValueLockedToken1: new BigDecimal(0),
    totalValueLockedETH: new BigDecimal(0),
    totalValueLockedUSD: new BigDecimal(0),
    totalValueLockedUSDUntracked: new BigDecimal(0),
    liquidityProviderCount: 0n,
    hooks: event.params.hooks,
  };

  await context.Pool.set(pool);
  await context.PoolManager.set(poolManager);
  await context.Token.set(token0);
  await context.Token.set(token1);
});

PoolManager.ModifyLiquidity.handler(async ({ event, context }) => {});

PoolManager.OperatorSet.handler(async ({ event, context }) => {});

PoolManager.OwnershipTransferred.handler(async ({ event, context }) => {
  let poolManager = await context.PoolManager.get(event.srcAddress);
  if (!poolManager) {
    return;
  }

  poolManager = {
    ...poolManager,
    owner: event.params.newOwner,
  };

  await context.PoolManager.set(poolManager);
});

PoolManager.ProtocolFeeControllerUpdated.handler(
  async ({ event, context }) => {}
);

PoolManager.ProtocolFeeUpdated.handler(async ({ event, context }) => {});

PoolManager.Swap.handler(async ({ event, context }) => {
  let poolManager = await context.PoolManager.get(
    `${event.chainId}_${event.srcAddress}`
  );
  let pool = await context.Pool.get(`${event.chainId}_${event.params.id}`);

  if (!poolManager || !pool) {
    return;
  }

  // Update pool
  const chainConfig = getChainConfig(Number(event.chainId));

  // Update pool prices
  const token0 = await context.Token.get(pool.token0);
  const token1 = await context.Token.get(pool.token1);

  if (!token0 || !token1) return;

  const prices = sqrtPriceX96ToTokenPrices(
    event.params.sqrtPriceX96,
    token0,
    token1,
    chainConfig.nativeTokenDetails
  );

  pool = {
    ...pool,
    txCount: pool.txCount + 1n,
    sqrtPrice: event.params.sqrtPriceX96,
    tick: event.params.tick,
    token0Price: prices[0],
    token1Price: prices[1],
    volumeToken0: pool.volumeToken0.plus(
      new BigDecimal(event.params.amount0.toString())
    ),
    volumeToken1: pool.volumeToken1.plus(
      new BigDecimal(event.params.amount1.toString())
    ),
    liquidity: event.params.liquidity,
  };

  // Update pool manager
  poolManager = {
    ...poolManager,
    txCount: poolManager.txCount + 1n,
    totalVolumeETH: new BigDecimal(0),
    totalVolumeUSD: new BigDecimal(0),
    untrackedVolumeUSD: new BigDecimal(0),
    totalFeesETH: new BigDecimal(0),
    totalFeesUSD: new BigDecimal(0),
    totalValueLockedETH: new BigDecimal(0),
    totalValueLockedUSD: new BigDecimal(0),
    totalValueLockedETHUntracked: new BigDecimal(0),
    totalValueLockedUSDUntracked: new BigDecimal(0),
  };

  const entity: Swap = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    chainId: BigInt(event.chainId),
    transaction: event.block.hash,
    timestamp: BigInt(event.block.timestamp),
    pool: event.params.id,
    token0: pool.token0,
    token1: pool.token1,
    sender: event.params.sender,
    origin: event.srcAddress,
    amount0: new BigDecimal(event.params.amount0.toString()),
    amount1: new BigDecimal(event.params.amount1.toString()),
    amountUSD: new BigDecimal(0),
    sqrtPriceX96: event.params.sqrtPriceX96,
    tick: event.params.tick,
    logIndex: BigInt(event.logIndex),
  };

  // Update Bundle with new ETH price
  console.log("Chain config:", {
    // Debug log
    chainId: event.chainId,
    poolId: chainConfig.stablecoinWrappedNativePoolId,
    isToken0: chainConfig.stablecoinIsToken0,
  });
  let bundle = await context.Bundle.get("1");
  if (!bundle) {
    bundle = {
      id: "1",
      ethPriceUSD: new BigDecimal("0"),
    };
  }

  // Use immutability pattern
  await context.Bundle.set({
    ...bundle,
    ethPriceUSD: await getNativePriceInUSD(
      context,
      event.chainId.toString(),
      chainConfig.stablecoinWrappedNativePoolId,
      chainConfig.stablecoinIsToken0
    ),
  });

  await context.Pool.set(pool);
  await context.PoolManager.set(poolManager);
  await context.Swap.set(entity);
});

PoolManager.Transfer.handler(async ({ event, context }) => {});
