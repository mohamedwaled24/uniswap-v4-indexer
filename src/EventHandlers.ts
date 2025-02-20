/*
 * Please refer to https://docs.envio.dev for a thorough guide on all Envio indexer features
 */
import { PoolManager, Swap, BigDecimal } from "generated";

PoolManager.Approval.handler(async ({ event, context }) => {});

PoolManager.Donate.handler(async ({ event, context }) => {});

PoolManager.Initialize.handler(async ({ event, context }) => {
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

  // Create new pool
  const pool = {
    id: `${event.chainId}_${event.params.id}`,
    chainId: BigInt(event.chainId),
    createdAtTimestamp: BigInt(event.block.timestamp),
    createdAtBlockNumber: BigInt(event.block.number),
    token0: event.params.currency0,
    token1: event.params.currency1,
    feeTier: BigInt(event.params.fee),
    liquidity: 0n,
    sqrtPrice: event.params.sqrtPriceX96,
    token0Price: new BigDecimal(0),
    token1Price: new BigDecimal(0),
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
  pool = {
    ...pool,
    txCount: pool.txCount + 1n,
    sqrtPrice: event.params.sqrtPriceX96,
    tick: event.params.tick,
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

  await context.Pool.set(pool);
  await context.PoolManager.set(poolManager);
  await context.Swap.set(entity);
});

PoolManager.Transfer.handler(async ({ event, context }) => {});
