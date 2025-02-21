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

// TODO: Implement these handlers
PoolManager.Approval.handler(async ({ event, context }) => {});
PoolManager.Donate.handler(async ({ event, context }) => {});
PoolManager.Transfer.handler(async ({ event, context }) => {});
PoolManager.ProtocolFeeUpdated.handler(async ({ event, context }) => {});
PoolManager.OwnershipTransferred.handler(async ({ event, context }) => {});
PoolManager.ProtocolFeeControllerUpdated.handler(
  async ({ event, context }) => {}
);

PoolManager.Initialize.handler(async ({ event, context }) => {
  // Get chain config for whitelist tokens
  const chainConfig = getChainConfig(Number(event.chainId));

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

  // Create or get token0
  const token0Id = `${event.chainId}_${event.params.currency0.toLowerCase()}`;
  let token0 = await context.Token.get(token0Id);
  if (!token0) {
    const metadata = await getTokenMetadata(event.params.currency0); // adjust for multichain in future
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
    const metadata = await getTokenMetadata(event.params.currency1);
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

PoolManager.ModifyLiquidity.handler(async ({ event, context }) => {
  let pool = await context.Pool.get(`${event.chainId}_${event.params.id}`);
  if (!pool) return;

  let token0 = await context.Token.get(pool.token0);
  let token1 = await context.Token.get(pool.token1);
  if (!token0 || !token1) return;

  const bundle = await context.Bundle.get("1");
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

  // token0 = {
  //   ...token0,
  //   totalValueLockedUSD: token0.totalValueLocked
  //     .times(token0.derivedETH)
  //     .times(bundle.ethPriceUSD),
  // };

  // token1 = {
  //   ...token1,
  //   totalValueLockedUSD: token1.totalValueLocked
  //     .times(token1.derivedETH)
  //     .times(bundle.ethPriceUSD),
  // };

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

  let bundle = await context.Bundle.get("1");
  if (!bundle) {
    bundle = {
      id: "1",
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

  // In Swap handler, after updating token amounts
  // const amount0Abs = amount0.lt(ZERO_BD)
  //   ? amount0.times(new BigDecimal("-1"))
  //   : amount0;
  // const amount1Abs = amount1.lt(ZERO_BD)
  //   ? amount1.times(new BigDecimal("-1"))
  //   : amount1;

  // const amount0ETH = amount0Abs.times(token0.derivedETH);
  // const amount1ETH = amount1Abs.times(token1.derivedETH);
  // const amount0USD = amount0ETH.times(bundle.ethPriceUSD);
  // const amount1USD = amount1ETH.times(bundle.ethPriceUSD);

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

  let entity: Swap = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    chainId: BigInt(event.chainId),
    transaction: event.transaction.hash,
    timestamp: BigInt(event.block.timestamp),
    pool: event.params.id,
    token0: pool.token0,
    token1: pool.token1,
    sender: event.params.sender,
    origin: event.srcAddress,
    amount0: amount0,
    amount1: amount1,
    amountUSD: new BigDecimal(0),
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
});
