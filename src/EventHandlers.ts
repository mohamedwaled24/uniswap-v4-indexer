/*
 * Please refer to https://docs.envio.dev for a thorough guide on all Envio indexer features
 */
import { PoolManager, Swap } from "generated";

PoolManager.Approval.handler(async ({ event, context }) => {
  console.log("Approval event received", event);
});

PoolManager.Donate.handler(async ({ event, context }) => {
  console.log("Donate event received", event);
});

PoolManager.Initialize.handler(async ({ event, context }) => {
  let poolManager = await context.PoolManager.get(event.srcAddress);
  if (!poolManager) {
    poolManager = {
      id: event.srcAddress,
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
  await context.PoolManager.set(poolManager);
});

PoolManager.ModifyLiquidity.handler(async ({ event, context }) => {
  console.log("ModifyLiquidity event received", event);
});

PoolManager.OperatorSet.handler(async ({ event, context }) => {
  console.log("OperatorSet event received", event);
});

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

PoolManager.ProtocolFeeControllerUpdated.handler(async ({ event, context }) => {
  console.log("ProtocolFeeControllerUpdated event received", event);
});

PoolManager.ProtocolFeeUpdated.handler(async ({ event, context }) => {
  console.log("ProtocolFeeUpdated event received", event);
});

PoolManager.Swap.handler(async ({ event, context }) => {
  let poolManager = await context.PoolManager.get(event.srcAddress);
  if (!poolManager) {
    return;
  }

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
    transaction: event.block.hash,
    timestamp: BigInt(event.block.timestamp),
    pool: event.params.id,
    token0: "", // This needs to be populated from pool data
    token1: "", // This needs to be populated from pool data
    sender: event.params.sender,
    origin: event.srcAddress,
    amount0: event.params.amount0,
    amount1: event.params.amount1,
    amountUSD: BigInt(0),
    sqrtPriceX96: event.params.sqrtPriceX96,
    tick: event.params.tick,
    logIndex: BigInt(event.logIndex),
  };

  await context.PoolManager.set(poolManager);
  await context.Swap.set(entity);
});

PoolManager.Transfer.handler(async ({ event, context }) => {
  console.log("Transfer event received", event);
});
