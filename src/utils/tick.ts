import { BigDecimal } from "generated";
import { ONE_BD, ZERO_BI } from "./constants";
import { fastExponentiation, safeDiv } from "./index";

export async function createTick(
  tickId: string,
  tickIdx: number,
  poolId: string,
  chainId: bigint,
  timestamp: bigint,
  blockNumber: bigint,
  context: any
) {
  console.log(`🔧 createTick called with:`, {
    tickId,
    tickIdx,
    poolId,
    chainId: chainId.toString(),
    timestamp: timestamp.toString(),
    blockNumber: blockNumber.toString(),
  });

  const tick = {
    id: tickId,
    chainId,
    pool_id: poolId,
    tickIdx: BigInt(tickIdx),
    poolAddress: poolId,
    createdAtTimestamp: timestamp,
    createdAtBlockNumber: blockNumber,
    liquidityGross: ZERO_BI,
    liquidityNet: ZERO_BI,
    price0: ONE_BD,
    price1: ONE_BD,
  };

  console.log(`📊 Initial tick object created:`, {
    id: tick.id,
    chainId: tick.chainId.toString(),
    tickIdx: tick.tickIdx.toString(),
    liquidityGross: tick.liquidityGross.toString(),
    liquidityNet: tick.liquidityNet.toString(),
    price0: tick.price0.toString(),
    price1: tick.price1.toString(),
  });

  // 1.0001^tick is token1/token0.
  console.log(`💰 Calculating price0 with tickIdx: ${tickIdx}`);
  const price0Raw = fastExponentiation(new BigDecimal("1.0001"), tickIdx);
  console.log(`💰 price0 calculated (raw): ${price0Raw.toString()}`);

  // Limit precision to prevent PostgreSQL overflow (18 decimal places should be plenty)
  const price0 = new BigDecimal(price0Raw.toFixed(18));
  console.log(`💰 price0 truncated to 18 decimals: ${price0.toString()}`);

  tick.price0 = price0;
  console.log(`💰 price0 assigned to tick`);

  console.log(`💰 Calculating price1 (safeDiv)`);
  const price1Raw = safeDiv(ONE_BD, price0);
  const price1 = new BigDecimal(price1Raw.toFixed(18));
  tick.price1 = price1;
  console.log(`💰 price1 calculated and truncated: ${tick.price1.toString()}`);

  console.log(`✅ Final tick object before return:`, {
    id: tick.id,
    chainId: tick.chainId.toString(),
    pool_id: tick.pool_id,
    tickIdx: tick.tickIdx.toString(),
    poolAddress: tick.poolAddress,
    createdAtTimestamp: tick.createdAtTimestamp.toString(),
    createdAtBlockNumber: tick.createdAtBlockNumber.toString(),
    liquidityGross: tick.liquidityGross.toString(),
    liquidityNet: tick.liquidityNet.toString(),
    price0: tick.price0.toString(),
    price1: tick.price1.toString(),
  });

  return tick;
}

export async function getOrInitTick(
  poolAddress: string,
  tickIdx: bigint,
  chainId: bigint,
  timestamp: bigint,
  blockNumber: bigint,
  context: any
) {
  const tickId = `${poolAddress}#${tickIdx.toString()}`;

  let tick = await context.Tick.get(tickId);

  if (!tick) {
    tick = await createTick(
      tickId,
      Number(tickIdx),
      poolAddress,
      chainId,
      timestamp,
      blockNumber,
      context
    );
  }

  return tick;
}

export function updateTickLiquidity(
  tick: any,
  liquidityDelta: bigint,
  isUpper: boolean
) {
  // Update liquidityGross (always add absolute value)
  const absLiquidityDelta =
    liquidityDelta < 0n ? -liquidityDelta : liquidityDelta;
  const newLiquidityGross = tick.liquidityGross + absLiquidityDelta;

  // Update liquidityNet based on whether this is upper or lower tick
  let newLiquidityNet: bigint;
  if (isUpper) {
    // Upper tick: subtract liquidity delta (liquidity decreases when crossing up)
    newLiquidityNet = tick.liquidityNet - liquidityDelta;
  } else {
    // Lower tick: add liquidity delta (liquidity increases when crossing up)
    newLiquidityNet = tick.liquidityNet + liquidityDelta;
  }

  return {
    ...tick,
    liquidityGross: newLiquidityGross,
    liquidityNet: newLiquidityNet,
  };
}
