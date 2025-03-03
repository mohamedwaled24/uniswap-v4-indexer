/*
 * Please refer to https://docs.envio.dev for a thorough guide on all Envio indexer features
 */
import { PoolManager, Swap, Token, BigDecimal } from "generated";
import { getChainConfig } from "./utils/chains";
import { getNativePriceInUSD } from "./utils/pricing";
import { sqrtPriceX96ToTokenPrices } from "./utils/pricing";
import { getTokenMetadata } from "./utils/tokenMetadata";
import { findNativePerToken } from "./utils/pricing";
import { getAmount0, getAmount1 } from "./utils/liquidityMath/liquidityAmounts";
import { convertTokenToDecimal } from "./utils";
import { getTrackedAmountUSD } from "./utils/pricing";
import { safeDiv } from "./utils/index";

// TODO: Implement these handlers
// PoolManager.Approval.handler(async ({ event, context }) => {});
// PoolManager.Donate.handler(async ({ event, context }) => {});
// PoolManager.Transfer.handler(async ({ event, context }) => {});
// PoolManager.ProtocolFeeUpdated.handler(async ({ event, context }) => {});
// PoolManager.OwnershipTransferred.handler(async ({ event, context }) => {});
// PoolManager.ProtocolFeeControllerUpdated.handler(
//   async ({ event, context }) => {}
// );

PoolManager.Initialize.handler(async ({ event, context }) => {
  // Get chain config for whitelist tokens
  const chainConfig = getChainConfig(Number(event.chainId));

  // Define isHookedPool at the start
  const isHookedPool =
    event.params.hooks !== "0x0000000000000000000000000000000000000000";

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
      numberOfSwaps: 0n,
      hookedPools: 0n,
      hookedSwaps: 0n,
    };
    await context.Bundle.set({
      id: event.chainId.toString(),
      ethPriceUSD: new BigDecimal("0"),
    });
  } else {
    poolManager = {
      ...poolManager,
      poolCount: poolManager.poolCount + 1n,
    };
  }

  // Update or create HookStats if this is a hooked pool
  if (isHookedPool) {
    poolManager = {
      ...poolManager,
      hookedPools: poolManager.hookedPools + 1n,
    };

    const hookStatsId = `${event.chainId}_${event.params.hooks}`;
    let hookStats = await context.HookStats.get(hookStatsId);

    if (!hookStats) {
      hookStats = {
        id: hookStatsId,
        chainId: BigInt(event.chainId),
        numberOfPools: 1n,
        numberOfSwaps: 0n,
        firstPoolCreatedAt: BigInt(event.block.timestamp),
        totalValueLockedUSD: new BigDecimal("0"),
        totalVolumeUSD: new BigDecimal("0"),
        untrackedVolumeUSD: new BigDecimal("0"),
        totalFeesUSD: new BigDecimal("0"),
      };
    }

    hookStats = {
      ...hookStats,
      numberOfPools: hookStats.numberOfPools + 1n,
    };

    await context.HookStats.set(hookStats);
  }

  // Create or get token0
  const token0Id = `${event.chainId}_${event.params.currency0.toLowerCase()}`;
  let token0 = await context.Token.get(token0Id);
  if (!token0) {
    const metadata = await getTokenMetadata(
      event.params.currency0,
      Number(event.chainId)
    );
    token0 = {
      id: token0Id,
      chainId: BigInt(event.chainId),
      symbol: metadata.symbol,
      name: metadata.name,
      decimals: BigInt(metadata.decimals),
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
    const metadata = await getTokenMetadata(
      event.params.currency1,
      Number(event.chainId)
    );
    token1 = {
      id: token1Id,
      chainId: BigInt(event.chainId),
      symbol: metadata.symbol,
      name: metadata.name,
      decimals: BigInt(metadata.decimals),
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

  // Update whitelist pools first
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

  // Calculate initial prices
  const prices = sqrtPriceX96ToTokenPrices(
    event.params.sqrtPriceX96,
    token0,
    token1,
    chainConfig.nativeTokenDetails
  );

  const feeBps = Number(event.params.fee) / 10000; // Convert to percentage (fee is in bps)
  const poolName = `${token0.symbol} / ${token1.symbol} - ${feeBps}%`;

  // Create new pool with prices
  const pool = {
    id: `${event.chainId}_${event.params.id}`,
    chainId: BigInt(event.chainId),
    name: poolName,
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
    feesUSD: new BigDecimal("0"),
    feesUSDUntracked: new BigDecimal("0"),
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

  // Now update derivedETH values
  token0 = {
    ...token0,
    derivedETH: await findNativePerToken(
      context,
      token0,
      chainConfig.wrappedNativeAddress,
      chainConfig.stablecoinAddresses,
      chainConfig.minimumNativeLocked
    ),
  };

  token1 = {
    ...token1,
    derivedETH: await findNativePerToken(
      context,
      token1,
      chainConfig.wrappedNativeAddress,
      chainConfig.stablecoinAddresses,
      chainConfig.minimumNativeLocked
    ),
  };

  await context.Pool.set(pool);
  await context.PoolManager.set(poolManager);
  await context.Token.set(token0);
  await context.Token.set(token1);
});

PoolManager.ModifyLiquidity.handler(async ({ event, context }) => {
  let pool = await context.Pool.get(`${event.chainId}_${event.params.id}`);
  if (!pool) return;
  let token0 = await context.Token.get(pool.token0);
  let token1 = await context.Token.get(pool.token1);
  if (!token0 || !token1) return;
  const bundle = await context.Bundle.get(event.chainId.toString());
  if (!bundle) return;
  const currTick = pool.tick ?? 0n;
  const currSqrtPriceX96 = pool.sqrtPrice ?? 0n;
  // Calculate the token amounts from the liquidity change
  const amount0Raw = getAmount0(
    event.params.tickLower,
    event.params.tickUpper,
    currTick,
    event.params.liquidityDelta,
    currSqrtPriceX96
  );
  const amount1Raw = getAmount1(
    event.params.tickLower,
    event.params.tickUpper,
    currTick,
    event.params.liquidityDelta,
    currSqrtPriceX96
  );
  // Convert to proper decimals
  const amount0 = convertTokenToDecimal(amount0Raw, token0.decimals);
  const amount1 = convertTokenToDecimal(amount1Raw, token1.decimals);
  // Update pool TVL
  pool = {
    ...pool,
    totalValueLockedToken0: pool.totalValueLockedToken0.plus(amount0),
    totalValueLockedToken1: pool.totalValueLockedToken1.plus(amount1),
  };
  // Only update liquidity if position is in range
  if (
    event.params.tickLower <= (pool.tick ?? 0n) &&
    event.params.tickUpper > (pool.tick ?? 0n)
  ) {
    pool = {
      ...pool,
      liquidity: pool.liquidity + event.params.liquidityDelta,
    };
  }
  // Update token TVL
  token0 = {
    ...token0,
    totalValueLocked: token0.totalValueLocked.plus(amount0),
  };
  token1 = {
    ...token1,
    totalValueLocked: token1.totalValueLocked.plus(amount1),
  };
  // Store current pool TVL for later
  const currentPoolTvlETH = pool.totalValueLockedETH;
  const currentPoolTvlUSD = pool.totalValueLockedUSD;
  // After updating token TVLs, calculate ETH and USD values
  pool = {
    ...pool,
    totalValueLockedETH: pool.totalValueLockedToken0
      .times(token0.derivedETH)
      .plus(pool.totalValueLockedToken1.times(token1.derivedETH)),
  };
  pool = {
    ...pool,
    totalValueLockedUSD: pool.totalValueLockedETH.times(bundle.ethPriceUSD),
  };
  // Update PoolManager
  let poolManager = await context.PoolManager.get(
    `${event.chainId}_${event.srcAddress}`
  );
  if (!poolManager) return;
  poolManager = {
    ...poolManager,
    txCount: poolManager.txCount + 1n,
    // Reset and recalculate TVL
    totalValueLockedETH: poolManager.totalValueLockedETH
      .minus(currentPoolTvlETH)
      .plus(pool.totalValueLockedETH),
  };
  poolManager = {
    ...poolManager,
    totalValueLockedUSD: poolManager.totalValueLockedETH.times(
      bundle.ethPriceUSD
    ),
  };

  // Check if this is a hooked pool and update HookStats
  const isHookedPool =
    pool.hooks !== "0x0000000000000000000000000000000000000000";

  if (isHookedPool) {
    const hookStatsId = `${event.chainId}_${pool.hooks}`;
    let hookStats = await context.HookStats.get(hookStatsId);

    if (hookStats) {
      // Update the TVL for this hook
      hookStats = {
        ...hookStats,
        totalValueLockedUSD: hookStats.totalValueLockedUSD
          .minus(currentPoolTvlUSD) // Remove old TVL
          .plus(pool.totalValueLockedETH.times(bundle.ethPriceUSD)), // Add new TVL
      };
      await context.HookStats.set(hookStats);
    }
  }

  await context.PoolManager.set(poolManager);
  await context.Pool.set(pool);
  await context.Token.set(token0);
  await context.Token.set(token1);
});

PoolManager.Swap.handler(async ({ event, context }) => {
  const chainConfig = getChainConfig(Number(event.chainId));
  let poolManager = await context.PoolManager.get(
    `${event.chainId}_${event.srcAddress}`
  );
  let pool = await context.Pool.get(`${event.chainId}_${event.params.id}`);
  if (!poolManager || !pool) {
    return;
  }
  let bundle = await context.Bundle.get(event.chainId.toString());
  if (!bundle) {
    bundle = {
      id: event.chainId.toString(),
      ethPriceUSD: new BigDecimal("0"),
    };
  }
  let token0 = await context.Token.get(pool.token0);
  let token1 = await context.Token.get(pool.token1);
  if (!token0 || !token1) return;
  // Update tokens' derivedETH values first
  token0 = {
    ...token0,
    derivedETH: await findNativePerToken(
      context,
      token0,
      chainConfig.wrappedNativeAddress,
      chainConfig.stablecoinAddresses,
      chainConfig.minimumNativeLocked
    ),
  };
  token1 = {
    ...token1,
    derivedETH: await findNativePerToken(
      context,
      token1,
      chainConfig.wrappedNativeAddress,
      chainConfig.stablecoinAddresses,
      chainConfig.minimumNativeLocked
    ),
  };
  const prices = sqrtPriceX96ToTokenPrices(
    event.params.sqrtPriceX96,
    token0,
    token1,
    chainConfig.nativeTokenDetails
  );
  // Convert amounts using proper decimal handling
  // Unlike V3, a negative amount represents that amount is being sent to the pool and vice versa, so invert the sign
  const amount0 = convertTokenToDecimal(
    event.params.amount0,
    token0.decimals
  ).times(new BigDecimal("-1"));
  const amount1 = convertTokenToDecimal(
    event.params.amount1,
    token1.decimals
  ).times(new BigDecimal("-1"));
  // Get absolute amounts for volume
  const amount0Abs = amount0.lt(new BigDecimal("0"))
    ? amount0.times(new BigDecimal("-1"))
    : amount0;
  const amount1Abs = amount1.lt(new BigDecimal("0"))
    ? amount1.times(new BigDecimal("-1"))
    : amount1;
  const amount0ETH = amount0Abs.times(token0.derivedETH);
  const amount1ETH = amount1Abs.times(token1.derivedETH);
  const amount0USD = amount0ETH.times(bundle.ethPriceUSD);
  const amount1USD = amount1ETH.times(bundle.ethPriceUSD);
  // Get tracked amount USD
  const trackedAmountUSD = await getTrackedAmountUSD(
    context,
    amount0Abs,
    token0,
    amount1Abs,
    token1,
    event.chainId.toString(),
    chainConfig.whitelistTokens
  );
  const amountTotalUSDTracked = trackedAmountUSD.div(new BigDecimal("2"));
  const amountTotalETHTracked = safeDiv(
    amountTotalUSDTracked,
    bundle.ethPriceUSD
  );
  const amountTotalUSDUntracked = amount0USD
    .plus(amount1USD)
    .div(new BigDecimal("2"));
  // Calculate fees
  const feesETH = amountTotalETHTracked
    .times(pool.feeTier.toString())
    .div(new BigDecimal("1000000"));
  const feesUSD = amountTotalUSDTracked
    .times(pool.feeTier.toString())
    .div(new BigDecimal("1000000"));
  // Calculate untracked fees
  const feesUSDUntracked = amountTotalUSDUntracked.times(
    new BigDecimal(pool.feeTier.toString()).div(new BigDecimal("1000000"))
  );
  // Calculate collected fees in tokens
  const feesToken0 = amount0Abs
    .times(pool.feeTier.toString())
    .div(new BigDecimal("1000000"));
  const feesToken1 = amount1Abs
    .times(pool.feeTier.toString())
    .div(new BigDecimal("1000000"));
  // Store current pool TVL values for later calculations
  const currentPoolTvlETH = pool.totalValueLockedETH;
  const currentPoolTvlUSD = pool.totalValueLockedUSD;
  // Update pool values
  pool = {
    ...pool,
    txCount: pool.txCount + 1n,
    sqrtPrice: event.params.sqrtPriceX96,
    tick: event.params.tick,
    token0Price: prices[0],
    token1Price: prices[1],
    totalValueLockedToken0: pool.totalValueLockedToken0.plus(amount0),
    totalValueLockedToken1: pool.totalValueLockedToken1.plus(amount1),
    liquidity: event.params.liquidity,
    volumeToken0: pool.volumeToken0.plus(amount0Abs),
    volumeToken1: pool.volumeToken1.plus(amount1Abs),
    volumeUSD: pool.volumeUSD.plus(amountTotalUSDTracked),
    untrackedVolumeUSD: pool.untrackedVolumeUSD.plus(amountTotalUSDUntracked),
    feesUSD: pool.feesUSD.plus(feesUSD),
    feesUSDUntracked: pool.feesUSDUntracked.plus(feesUSDUntracked),
    collectedFeesToken0: pool.collectedFeesToken0.plus(feesToken0),
    collectedFeesToken1: pool.collectedFeesToken1.plus(feesToken1),
    collectedFeesUSD: pool.collectedFeesUSD.plus(feesUSD),
  };
  pool = {
    ...pool,
    totalValueLockedETH: pool.totalValueLockedToken0
      .times(token0.derivedETH)
      .plus(pool.totalValueLockedToken1.times(token1.derivedETH)),
  };
  pool = {
    ...pool,
    totalValueLockedUSD: pool.totalValueLockedETH.times(bundle.ethPriceUSD),
  };
  // Update PoolManager aggregates
  poolManager = {
    ...poolManager,
    txCount: poolManager.txCount + 1n,
    totalVolumeETH: poolManager.totalVolumeETH.plus(amountTotalETHTracked),
    totalVolumeUSD: poolManager.totalVolumeUSD.plus(amountTotalUSDTracked),
    untrackedVolumeUSD: poolManager.untrackedVolumeUSD.plus(
      amountTotalUSDUntracked
    ),
    totalFeesETH: poolManager.totalFeesETH.plus(feesETH),
    totalFeesUSD: poolManager.totalFeesUSD.plus(feesUSD),
    // Reset and recalculate TVL
    totalValueLockedETH: poolManager.totalValueLockedETH
      .minus(currentPoolTvlETH)
      .plus(pool.totalValueLockedETH),
  };
  // Then calculate USD value based on the updated ETH value
  poolManager = {
    ...poolManager,
    totalValueLockedUSD: poolManager.totalValueLockedETH.times(
      bundle.ethPriceUSD
    ),
  };
  let entity: Swap = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    chainId: BigInt(event.chainId),
    transaction: event.transaction.hash,
    timestamp: BigInt(event.block.timestamp),
    pool: `${event.chainId}_${event.params.id}`,
    token0_id: token0.id,
    token1_id: token1.id,
    sender: event.params.sender,
    origin: event.srcAddress,
    amount0: amount0,
    amount1: amount1,
    amountUSD: amountTotalUSDTracked,
    sqrtPriceX96: event.params.sqrtPriceX96,
    tick: event.params.tick,
    logIndex: BigInt(event.logIndex),
  };
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
  await context.Token.set(token0);
  await context.Token.set(token1);

  const isHookedPool =
    pool.hooks !== "0x0000000000000000000000000000000000000000";

  poolManager = {
    ...poolManager,
    numberOfSwaps: poolManager.numberOfSwaps + 1n,
    hookedSwaps: isHookedPool
      ? poolManager.hookedSwaps + 1n
      : poolManager.hookedSwaps,
  };

  await context.PoolManager.set(poolManager);

  // After processing the swap, update HookStats if it's a hooked pool
  if (isHookedPool) {
    const hookStatsId = `${event.chainId}_${pool.hooks}`;
    let hookStats = await context.HookStats.get(hookStatsId);

    if (hookStats) {
      // Calculate volume and fees, using untracked volume as fallback
      const volumeToAdd = amountTotalUSDTracked.gt(new BigDecimal("0"))
        ? amountTotalUSDTracked
        : amountTotalUSDUntracked;

      // Calculate fees based on the volume we're using (use the same calculation as earlier in the code)
      const feesToAdd = amountTotalUSDTracked.gt(new BigDecimal("0"))
        ? feesUSD
        : amountTotalUSDUntracked.times(
            new BigDecimal(pool.feeTier.toString()).div(
              new BigDecimal("1000000")
            )
          );

      hookStats = {
        ...hookStats,
        numberOfSwaps: hookStats.numberOfSwaps + 1n,
        totalVolumeUSD: hookStats.totalVolumeUSD.plus(volumeToAdd), // right now this is includes untracked volume
        untrackedVolumeUSD: hookStats.untrackedVolumeUSD.plus(
          amountTotalUSDUntracked
        ),
        totalFeesUSD: hookStats.totalFeesUSD.plus(feesToAdd),
        totalValueLockedUSD: hookStats.totalValueLockedUSD
          .minus(currentPoolTvlUSD) // Remove old TVL
          .plus(pool.totalValueLockedUSD), // Add new TVL
      };
      await context.HookStats.set(hookStats);
    }
  }
});
