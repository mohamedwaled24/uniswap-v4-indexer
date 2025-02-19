/*
 * Please refer to https://docs.envio.dev for a thorough guide on all Envio indexer features
 */
import { PoolManager, Swap } from "generated";

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
      poolCount: BigInt(1),
      txCount: BigInt(0),
      totalVolumeUSD: BigInt(0),
      totalVolumeETH: BigInt(0),
      totalFeesUSD: BigInt(0),
      totalFeesETH: BigInt(0),
      untrackedVolumeUSD: BigInt(0),
      totalValueLockedUSD: BigInt(0),
      totalValueLockedETH: BigInt(0),
      totalValueLockedUSDUntracked: BigInt(0),
      totalValueLockedETHUntracked: BigInt(0),
      owner: event.srcAddress,
    };
  } else {
    poolManager = {
      ...poolManager,
      poolCount: poolManager.poolCount + BigInt(1),
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
    liquidity: BigInt(0),
    sqrtPrice: event.params.sqrtPriceX96,
    token0Price: BigInt(0),
    token1Price: BigInt(0),
    tick: event.params.tick,
    tickSpacing: BigInt(event.params.tickSpacing),
    observationIndex: BigInt(0),
    volumeToken0: BigInt(0),
    volumeToken1: BigInt(0),
    volumeUSD: BigInt(0),
    untrackedVolumeUSD: BigInt(0),
    feesUSD: BigInt(0),
    txCount: BigInt(0),
    collectedFeesToken0: BigInt(0),
    collectedFeesToken1: BigInt(0),
    collectedFeesUSD: BigInt(0),
    totalValueLockedToken0: BigInt(0),
    totalValueLockedToken1: BigInt(0),
    totalValueLockedETH: BigInt(0),
    totalValueLockedUSD: BigInt(0),
    totalValueLockedUSDUntracked: BigInt(0),
    liquidityProviderCount: BigInt(0),
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
    txCount: pool.txCount + BigInt(1),
    sqrtPrice: event.params.sqrtPriceX96,
    tick: event.params.tick,
    volumeToken0: pool.volumeToken0 + event.params.amount0,
    volumeToken1: pool.volumeToken1 + event.params.amount1,
    liquidity: event.params.liquidity,
  };

  // Update pool manager
  poolManager = {
    ...poolManager,
    txCount: poolManager.txCount + BigInt(1),
    totalVolumeETH: BigInt(0),
    totalVolumeUSD: BigInt(0),
    untrackedVolumeUSD: BigInt(0),
    totalFeesETH: BigInt(0),
    totalFeesUSD: BigInt(0),
    totalValueLockedETH: BigInt(0),
    totalValueLockedUSD: BigInt(0),
    totalValueLockedETHUntracked: BigInt(0),
    totalValueLockedUSDUntracked: BigInt(0),
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
    amount0: event.params.amount0,
    amount1: event.params.amount1,
    amountUSD: BigInt(0),
    sqrtPriceX96: event.params.sqrtPriceX96,
    tick: event.params.tick,
    logIndex: BigInt(event.logIndex),
  };

  await context.Pool.set(pool);
  await context.PoolManager.set(poolManager);
  await context.Swap.set(entity);
});

PoolManager.Transfer.handler(async ({ event, context }) => {});
