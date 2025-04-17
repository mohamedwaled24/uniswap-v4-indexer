/*
 * Liquidity event handlers for Uniswap v4 pools
 */
import { PoolManager } from "generated";
import {
  getAmount0,
  getAmount1,
} from "../utils/liquidityMath/liquidityAmounts";
import { convertTokenToDecimal } from "../utils";

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

  // Calculate amountUSD based on token prices
  const amountUSD = amount0
    .times(token0.derivedETH)
    .plus(amount1.times(token1.derivedETH))
    .times(bundle.ethPriceUSD);

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

  // Create ModifyLiquidity entity
  const modifyLiquidityId = `${event.chainId}_${event.transaction.hash}_${event.logIndex}`;
  const modifyLiquidity = {
    id: modifyLiquidityId,
    chainId: BigInt(event.chainId),
    transaction: event.transaction.hash,
    timestamp: BigInt(event.block.timestamp),
    pool_id: pool.id,
    token0_id: token0.id,
    token1_id: token1.id,
    sender: event.params.sender,
    origin: event.transaction.from || "NONE",
    amount: event.params.liquidityDelta,
    amount0: amount0,
    amount1: amount1,
    amountUSD: amountUSD,
    tickLower: BigInt(event.params.tickLower),
    tickUpper: BigInt(event.params.tickUpper),
    logIndex: BigInt(event.logIndex),
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

  await context.ModifyLiquidity.set(modifyLiquidity);
  await context.PoolManager.set(poolManager);
  await context.Pool.set(pool);
  await context.Token.set(token0);
  await context.Token.set(token1);
});
