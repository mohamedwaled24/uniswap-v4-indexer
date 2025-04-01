import {
  PositionManagerFlaunch,
  PositionManagerFlaunch_CreatorFeeAllocationUpdated,
  PositionManagerFlaunch_Deposit,
  PositionManagerFlaunch_FairLaunchFeeCalculatorUpdated,
  PositionManagerFlaunch_FeeCalculatorUpdated,
  PositionManagerFlaunch_FeeDistributionUpdated,
  PositionManagerFlaunch_InitialPriceUpdated,
  PositionManagerFlaunch_OwnershipHandoverCanceled,
  PositionManagerFlaunch_OwnershipHandoverRequested,
  PositionManagerFlaunch_OwnershipTransferred,
  PositionManagerFlaunch_PoolCreated,
  PositionManagerFlaunch_PoolFeeDistributionUpdated,
  PositionManagerFlaunch_PoolFeesDistributed,
  PositionManagerFlaunch_PoolFeesReceived,
  PositionManagerFlaunch_PoolFeesSwapped,
  PositionManagerFlaunch_PoolPremine,
  PositionManagerFlaunch_PoolScheduled,
  PositionManagerFlaunch_PoolStateUpdated,
  PositionManagerFlaunch_PoolSwap,
  PositionManagerFlaunch_ReferralEscrowUpdated,
  PositionManagerFlaunch_ReferrerFeePaid,
  PositionManagerFlaunch_Withdrawal,
} from "generated";

PositionManagerFlaunch.CreatorFeeAllocationUpdated.handler(async ({ event, context }) => {
  const entity: PositionManagerFlaunch_CreatorFeeAllocationUpdated = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    _poolId: event.params._poolId,
    _allocation: event.params._allocation,
  };

  context.PositionManagerFlaunch_CreatorFeeAllocationUpdated.set(entity);
});

PositionManagerFlaunch.Deposit.handler(async ({ event, context }) => {
  const entity: PositionManagerFlaunch_Deposit = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    _poolId: event.params._poolId,
    _payee: event.params._payee,
    _token: event.params._token,
    _amount: event.params._amount,
  };

  context.PositionManagerFlaunch_Deposit.set(entity);
});

PositionManagerFlaunch.FairLaunchFeeCalculatorUpdated.handler(async ({ event, context }) => {
  const entity: PositionManagerFlaunch_FairLaunchFeeCalculatorUpdated = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    _feeCalculator: event.params._feeCalculator,
  };

  context.PositionManagerFlaunch_FairLaunchFeeCalculatorUpdated.set(entity);
});

PositionManagerFlaunch.FeeCalculatorUpdated.handler(async ({ event, context }) => {
  const entity: PositionManagerFlaunch_FeeCalculatorUpdated = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    _feeCalculator: event.params._feeCalculator,
  };

  context.PositionManagerFlaunch_FeeCalculatorUpdated.set(entity);
});

PositionManagerFlaunch.FeeDistributionUpdated.handler(async ({ event, context }) => {
  const entity: PositionManagerFlaunch_FeeDistributionUpdated = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    _feeDistribution_0: event.params._feeDistribution
    [0]
    ,
    _feeDistribution_1: event.params._feeDistribution
    [1]
    ,
    _feeDistribution_2: event.params._feeDistribution
    [2]
    ,
    _feeDistribution_3: event.params._feeDistribution
    [3]
    ,
  };

  context.PositionManagerFlaunch_FeeDistributionUpdated.set(entity);
});

PositionManagerFlaunch.InitialPriceUpdated.handler(async ({ event, context }) => {
  const entity: PositionManagerFlaunch_InitialPriceUpdated = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    _initialPrice: event.params._initialPrice,
  };

  context.PositionManagerFlaunch_InitialPriceUpdated.set(entity);
});

PositionManagerFlaunch.OwnershipHandoverCanceled.handler(async ({ event, context }) => {
  const entity: PositionManagerFlaunch_OwnershipHandoverCanceled = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    pendingOwner: event.params.pendingOwner,
  };

  context.PositionManagerFlaunch_OwnershipHandoverCanceled.set(entity);
});

PositionManagerFlaunch.OwnershipHandoverRequested.handler(async ({ event, context }) => {
  const entity: PositionManagerFlaunch_OwnershipHandoverRequested = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    pendingOwner: event.params.pendingOwner,
  };

  context.PositionManagerFlaunch_OwnershipHandoverRequested.set(entity);
});

PositionManagerFlaunch.OwnershipTransferred.handler(async ({ event, context }) => {
  const entity: PositionManagerFlaunch_OwnershipTransferred = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    oldOwner: event.params.oldOwner,
    newOwner: event.params.newOwner,
  };

  context.PositionManagerFlaunch_OwnershipTransferred.set(entity);
});

PositionManagerFlaunch.PoolCreated.handler(async ({ event, context }) => {
  const entity: PositionManagerFlaunch_PoolCreated = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    _poolId: event.params._poolId,
    _memecoin: event.params._memecoin,
    _memecoinTreasury: event.params._memecoinTreasury,
    _tokenId: event.params._tokenId,
    _currencyFlipped: event.params._currencyFlipped,
    _flaunchFee: event.params._flaunchFee,
    _params_0: event.params._params
    [0]
    ,
    _params_1: event.params._params
    [1]
    ,
    _params_2: event.params._params
    [2]
    ,
    _params_3: event.params._params
    [3]
    ,
    _params_4: event.params._params
    [4]
    ,
    _params_5: event.params._params
    [5]
    ,
    _params_6: event.params._params
    [6]
    ,
    _params_7: event.params._params
    [7]
    ,
    _params_8: event.params._params
    [8]
    ,
    _params_9: event.params._params
    [9]
    ,
  };

  context.PositionManagerFlaunch_PoolCreated.set(entity);
});

PositionManagerFlaunch.PoolFeeDistributionUpdated.handler(async ({ event, context }) => {
  const entity: PositionManagerFlaunch_PoolFeeDistributionUpdated = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    _poolId: event.params._poolId,
    _feeDistribution_0: event.params._feeDistribution
    [0]
    ,
    _feeDistribution_1: event.params._feeDistribution
    [1]
    ,
    _feeDistribution_2: event.params._feeDistribution
    [2]
    ,
    _feeDistribution_3: event.params._feeDistribution
    [3]
    ,
  };

  context.PositionManagerFlaunch_PoolFeeDistributionUpdated.set(entity);
});

PositionManagerFlaunch.PoolFeesDistributed.handler(async ({ event, context }) => {
  const entity: PositionManagerFlaunch_PoolFeesDistributed = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    _poolId: event.params._poolId,
    _donateAmount: event.params._donateAmount,
    _creatorAmount: event.params._creatorAmount,
    _bidWallAmount: event.params._bidWallAmount,
    _governanceAmount: event.params._governanceAmount,
    _protocolAmount: event.params._protocolAmount,
  };

  context.PositionManagerFlaunch_PoolFeesDistributed.set(entity);
});

PositionManagerFlaunch.PoolFeesReceived.handler(async ({ event, context }) => {
  const entity: PositionManagerFlaunch_PoolFeesReceived = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    _poolId: event.params._poolId,
    _amount0: event.params._amount0,
    _amount1: event.params._amount1,
  };

  context.PositionManagerFlaunch_PoolFeesReceived.set(entity);
});

PositionManagerFlaunch.PoolFeesSwapped.handler(async ({ event, context }) => {
  const entity: PositionManagerFlaunch_PoolFeesSwapped = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    _poolId: event.params._poolId,
    zeroForOne: event.params.zeroForOne,
    _amount0: event.params._amount0,
    _amount1: event.params._amount1,
  };

  context.PositionManagerFlaunch_PoolFeesSwapped.set(entity);
});

PositionManagerFlaunch.PoolPremine.handler(async ({ event, context }) => {
  const entity: PositionManagerFlaunch_PoolPremine = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    _poolId: event.params._poolId,
    _premineAmount: event.params._premineAmount,
  };

  context.PositionManagerFlaunch_PoolPremine.set(entity);
});

PositionManagerFlaunch.PoolScheduled.handler(async ({ event, context }) => {
  const entity: PositionManagerFlaunch_PoolScheduled = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    _poolId: event.params._poolId,
    _flaunchesAt: event.params._flaunchesAt,
  };

  context.PositionManagerFlaunch_PoolScheduled.set(entity);
});

PositionManagerFlaunch.PoolStateUpdated.handler(async ({ event, context }) => {
  const entity: PositionManagerFlaunch_PoolStateUpdated = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    _poolId: event.params._poolId,
    _sqrtPriceX96: event.params._sqrtPriceX96,
    _tick: event.params._tick,
    _protocolFee: event.params._protocolFee,
    _swapFee: event.params._swapFee,
    _liquidity: event.params._liquidity,
  };

  context.PositionManagerFlaunch_PoolStateUpdated.set(entity);
});

PositionManagerFlaunch.PoolSwap.handler(async ({ event, context }) => {
  const entity: PositionManagerFlaunch_PoolSwap = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    poolId: event.params.poolId,
    flAmount0: event.params.flAmount0,
    flAmount1: event.params.flAmount1,
    flFee0: event.params.flFee0,
    flFee1: event.params.flFee1,
    ispAmount0: event.params.ispAmount0,
    ispAmount1: event.params.ispAmount1,
    ispFee0: event.params.ispFee0,
    ispFee1: event.params.ispFee1,
    uniAmount0: event.params.uniAmount0,
    uniAmount1: event.params.uniAmount1,
    uniFee0: event.params.uniFee0,
    uniFee1: event.params.uniFee1,
  };

  context.PositionManagerFlaunch_PoolSwap.set(entity);
});

PositionManagerFlaunch.ReferralEscrowUpdated.handler(async ({ event, context }) => {
  const entity: PositionManagerFlaunch_ReferralEscrowUpdated = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    _referralEscrow: event.params._referralEscrow,
  };

  context.PositionManagerFlaunch_ReferralEscrowUpdated.set(entity);
});

PositionManagerFlaunch.ReferrerFeePaid.handler(async ({ event, context }) => {
  const entity: PositionManagerFlaunch_ReferrerFeePaid = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    _poolId: event.params._poolId,
    _recipient: event.params._recipient,
    _token: event.params._token,
    _amount: event.params._amount,
  };

  context.PositionManagerFlaunch_ReferrerFeePaid.set(entity);
});

PositionManagerFlaunch.Withdrawal.handler(async ({ event, context }) => {
  const entity: PositionManagerFlaunch_Withdrawal = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    _sender: event.params._sender,
    _recipient: event.params._recipient,
    _token: event.params._token,
    _amount: event.params._amount,
  };

  context.PositionManagerFlaunch_Withdrawal.set(entity);
});
