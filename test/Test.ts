// import assert from "assert";
// import {
//   TestHelpers,
//   PositionManager_Approval
// } from "generated";
// const { MockDb, PositionManager } = TestHelpers;

// describe("PositionManager contract Approval event tests", () => {
//   // Create mock db
//   const mockDb = MockDb.createMockDb();

//   // Creating mock for PositionManager contract Approval event
//   const event = PositionManager.Approval.createMockEvent({/* It mocks event fields with default values. You can overwrite them if you need */});

//   it("PositionManager_Approval is created correctly", async () => {
//     // Processing the event
//     const mockDbUpdated = await PositionManager.Approval.processEvent({
//       event,
//       mockDb,
//     });

//     // Getting the actual entity from the mock database
//     let actualPositionManagerApproval = mockDbUpdated.entities.PositionManager_Approval.get(
//       `${event.chainId}_${event.block.number}_${event.logIndex}`
//     );

//     // Creating the expected entity
//     const expectedPositionManagerApproval: PositionManager_Approval = {
//       id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
//       owner: event.params.owner,
//       spender: event.params.spender,
//       id: event.params.id,
//     };
//     // Asserting that the entity in the mock database is the same as the expected entity
//     assert.deepEqual(actualPositionManagerApproval, expectedPositionManagerApproval, "Actual PositionManagerApproval should be the same as the expectedPositionManagerApproval");
//   });
// });
import assert from "assert";
import { MockDb, PoolManager } from "../generated/src/TestHelpers.gen";
import { BigDecimal, Bundle as BundleEntity, TestHelpers, Token as TokenEntity, } from "generated";
// import { handleSwapHelper } from "../src/mappings/swap";
// import {
//   USDC_MAINNET_FIXTURE,
//   WETH_MAINNET_FIXTURE,
//   USDC_WETH_POOL_ID,
//   TEST_CONFIG,
//   TEST_ETH_PRICE_USD,
//   TEST_USDC_DERIVED_ETH,
//   TEST_WETH_DERIVED_ETH,
// } from "./constants";
import { convertTokenToDecimal, safeDiv } from "../src/utils/index";
import { getTrackedAmountUSD, sqrtPriceX96ToTokenPrices, getNativePriceInUSD, findNativePerToken } from "../src/utils/pricing";
import { ZERO_BD } from "../src/utils/constants";
import { TEST_USDC_DERIVED_ETH, TEST_WETH_DERIVED_ETH, USDC_MAINNET_FIXTURE, USDC_WETH_POOL_ID } from "./constants";
import { TEST_ETH_PRICE_USD } from "./constants";

describe("handleSwap - Envio Test", () => {
  it("should update all entities correctly when a swap event is processed", async () => {
    // Step 1: Initialize an empty mock database
    let mockDb = MockDb.createMockDb();

    // Step 2: Setup initial state:
    // Create a Bundle entity with the test ETH price
    // bundle.ethPriceUSD = TEST_ETH_PRICE_USD;
    let bundle: BundleEntity = {
      id: "1",
      ethPriceUSD: TEST_ETH_PRICE_USD,
    }
    mockDb = mockDb.entities.Bundle.set(bundle);
    /*
    // Set up Token entities for USDC and WETH with derivedETH values
    const usdc: TokenEntity = {
      id: USDC_MAINNET_FIXTURE.address,
      derivedETH: TEST_USDC_DERIVED_ETH,
    }
    mockDb = mockDb.entities.Token.set(usdc);

    // const weth = new TokenEntity(WETH_MAINNET_FIXTURE.address);
    // weth.derivedETH = TEST_WETH_DERIVED_ETH;
    // mockDb = mockDb.entities.Token.set(weth);

    // (Optionally, simulate pool creation if needed by processing a pool created event)

    // Step 3: Create a mock swap event
    // Using Envio’s helper to generate a mock event (parameters as strings for simplicity)
    const swapEvent = PoolManager.Swap.createMockEvent({
      id: USDC_WETH_POOL_ID,
      sender: "0x841B5A0b3DBc473c8A057E2391014aa4C4751351",
      amount0: -10007n,
      amount1: 10000n,
      sqrtPriceX96: 79228162514264337514315787821n,
      liquidity: 10000000000000000000000n,
      tick: -1n,
      fee: 500n,
    });

    // Pre-calculate expected values (using the same math as in the original test)
    const token0 = usdc;
    const token1 = weth;
    const amount0 = convertTokenToDecimal(BigInt.fromString("-10007"), BigInt.fromString(USDC_MAINNET_FIXTURE.decimals))
      .times(BigDecimal("-1"));
    const amount1 = convertTokenToDecimal(BigInt.fromString("10000"), BigInt.fromString(WETH_MAINNET_FIXTURE.decimals))
      .times(BigDecimal("-1"));
    const amount0Abs = amount0.lt(ZERO_BD) ? amount0.times(BigDecimal("-1")) : amount0;
    const amount1Abs = amount1.lt(ZERO_BD) ? amount1.times(BigDecimal("-1")) : amount1;
    const amountTotalUSDTracked = getTrackedAmountUSD(
      amount0Abs,
      token0,
      amount1Abs,
      token1,
      TEST_CONFIG.whitelistTokens
    ).div(BigDecimal("2"));
    const amount0ETH = amount0Abs.times(TEST_USDC_DERIVED_ETH);
    const amount1ETH = amount1Abs.times(TEST_WETH_DERIVED_ETH);
    const amount0USD = amount0ETH.times(TEST_ETH_PRICE_USD);
    const amount1USD = amount1ETH.times(TEST_ETH_PRICE_USD);
    const amountTotalETHTracked = safeDiv(amountTotalUSDTracked, TEST_ETH_PRICE_USD);
    const amountTotalUSDUntracked = amount0USD.plus(amount1USD).div(BigDecimal("2"));
    const feeTierBD = BigDecimal("500");
    const feesETH = amountTotalETHTracked.times(feeTierBD).div(BigDecimal("1000000"));
    const feesUSD = amountTotalUSDTracked.times(feeTierBD).div(BigDecimal("1000000"));

    // Step 4: Process the swap event
    // Note: If your handler (handleSwapHelper) is not automatically invoked via processEvent,
    // you can call it directly inside processEvent or adjust your configuration accordingly.
    mockDb = await PoolManager.Swap.processEvent({
      event: swapEvent,
      mockDb: mockDb,
    });

    // (Optionally, if your mapping logic is separate, you could invoke handleSwapHelper(swapEvent, TEST_CONFIG) here)

    // Step 5: Recalculate updated values after event processing
    const newEthPrice = getNativePriceInUSD(USDC_WETH_POOL_ID, true);
    const newPoolPrices = sqrtPriceX96ToTokenPrices(
      BigInt.fromString("79228162514264337514315787821"),
      token0,
      token1,
      TEST_CONFIG.nativeTokenDetails
    );
    const newToken0DerivedETH = findNativePerToken(
      token0,
      TEST_CONFIG.wrappedNativeAddress,
      TEST_CONFIG.stablecoinAddresses,
      TEST_CONFIG.minimumNativeLocked
    );
    const newToken1DerivedETH = findNativePerToken(
      token1,
      TEST_CONFIG.wrappedNativeAddress,
      TEST_CONFIG.stablecoinAddresses,
      TEST_CONFIG.minimumNativeLocked
    );
    const totalValueLockedETH = amount0.times(newToken0DerivedETH).plus(amount1.times(newToken1DerivedETH));

    // Step 6: Assert that the updated state matches expectations

    // Example assertions for the PoolManager entity
    const poolManagerEntity = mockDb.entities.PoolManager.get(TEST_CONFIG.poolManagerAddress);
    assert.equal(poolManagerEntity.txCount, "1");
    assert.equal(poolManagerEntity.totalVolumeETH, amountTotalETHTracked.toString());
    // ... additional assertions for totalVolumeUSD, untrackedVolumeUSD, fees, TVL, etc.

    // Assertions for the Pool entity
    const poolEntity = mockDb.entities.Pool.get(USDC_WETH_POOL_ID);
    assert.equal(poolEntity.txCount, "1");
    // ... add further checks for liquidity, tick, sqrtPrice, token volumes, token prices, etc.

    // Assertions for Token entities (USDC and WETH)
    const usdcEntity = mockDb.entities.Token.get(USDC_MAINNET_FIXTURE.address);
    const wethEntity = mockDb.entities.Token.get(WETH_MAINNET_FIXTURE.address);
    assert.equal(usdcEntity.volume, amount0Abs.toString());
    assert.equal(wethEntity.volume, amount1Abs.toString());
    // ... additional assertions for fees, derivedETH, TVL, etc.

    // Assertion for the Swap entity (using a composite key like transaction hash + log index)
    const swapId = swapEvent.transaction.hash + "-" + swapEvent.logIndex;
    const swapEntity = mockDb.entities.Swap.get(swapId);
    assert.ok(swapEntity, "Swap entity should exist");

    // (Optional) Assertions for aggregated data (day and hour data)
    // For example, verify UniswapDayData, PoolDayData, TokenDayData, etc. match the computed volumes and fees.
    */
  });
});
