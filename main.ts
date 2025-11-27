import { MoonwellService } from "./services/moonwell.ts";
import { ChainlinkService } from "./services/chainlink.ts";
import { BaseService } from "./services/base.ts";
import { AerodromeService } from "./services/aerodrome.ts";
import { BaseTokens } from "./data/Tokens.ts";
// import * as MoonwellGauge from "./metrics/moonwell_gauge.ts";
// import * as BaseGauge from "./metrics/base_gauge.ts";
import { Address, getAddress, isAddress, formatUnits, formatEther } from "viem";

const baseService = new BaseService();
const aerodromeService = new AerodromeService();
const moonwellService = new MoonwellService();
const chainlink = new ChainlinkService();

const ethAddress = Deno.env.get("ETH_ADDRESS") || "0x";
try {
  if (isAddress(ethAddress)) {
    const address: Address = getAddress(ethAddress);
    // const ethBalance = await baseService.getEthBalance(address);

    // baseService.getTokenTransactions(address, BaseTokens.find(x => x.symbol == "VVV")!.address).then(c => {
    //   const i = c.forEach(x => {
    //     console.log(x.transactionHash);
    //   });
    // });

    await chainlink.getPairPrice();

    baseService.getTokensBalance(address).then(balance => {
      balance.tokens.filter(x => x.balance > 0).forEach(token => {
        console.log(`${token.symbol} Balance: ${token.balance}`);
      })
    });

    const AERODROME_GAUGE_ADDRESS: Address =
      "0x4f09bab2f0e15e2a078a227fe1537665f55b8360" as Address; // Replace with actual pool address

    try {
      const poolData = await aerodromeService.getPoolGaugeData(
        AERODROME_GAUGE_ADDRESS,
        "0xfbcbe7ad86b277a05fe260f037758cd5985e9c37",
      );

      const res0 = Number(poolData.reserve0 / poolData.dec0);
      const resPrice0 = await chainlink.getTokenPrice(poolData.token0) * res0;
      const res1 = poolData.reserve1 / poolData.dec1;
      const resPrice1 = await chainlink.getTokenPrice(poolData.token1) * Number(res1);

      console.log("Aerodrome Pool Gauge Data:");
      console.log(`  Token0: ${poolData.token0}`);
      console.log(`  Token1: ${poolData.token1}`);
      console.log(`  Reserve0: ${res0} - $${resPrice0}`);
      console.log(`  Reserve1: ${res1} - $${resPrice1}`);
      console.log(`  Earned Rewards: ${formatUnits(poolData.earned, BaseTokens.find(x => x.address == poolData.rewardToken)!.decimals)}`);
      console.log(`  Balance Of: ${formatEther(poolData.balanceOf)}`);
      console.log(`  TotalSupply: ${formatEther(poolData.totalSupply)}`);

      const poolTVL = resPrice0 + resPrice1;
      console.log(`  Pool TVL: $${poolTVL}`);
      const userShare = Number(formatEther(poolData.balanceOf)) / Number(formatEther(poolData.totalSupply));
      console.log(`  User Share: ${ (userShare * 100).toFixed(4) }%`);
      const marketPrice = userShare * poolTVL; // 0.0001578236630507249 but vfat indicate 0.00015410146155596743 deposit share ! Who is right ? 
      console.log(`  Market Price: $${marketPrice}`);
      // To fix !!! Not working yet
      console.log(`  Balance $: ${poolData.reserve0}`);
    } catch (error) {
      console.error("Failed to fetch Pool Gauge Data:", error);
    }
    const coreMarketPositions = await moonwellService.getUserPositions(address);
    const openCoreMarketPositions = coreMarketPositions.filter((position) =>
      position.supplied.value > 0 || position.borrowed.value > 0
    );

    const rewards = await moonwellService.getUserRewards(address);
    const openRewards = rewards.filter((reward) =>
      reward.supplyRewards.value > 0 || reward.borrowRewards.value > 0
    );

    const vaultPositions = await moonwellService.getMorphoVaultUserPositions(
      address,
    );
    const openVaultPositions = vaultPositions.filter((position) =>
      position.supplied.value > 0
    );

    // const markets = await moonwellService.getMarkets();

    const supplyBalanceUsd = openCoreMarketPositions.reduce(
      (acc, position) => acc + position.suppliedUsd,
      0,
    );
    const collateralBalanceUsd = openCoreMarketPositions.reduce(
      (acc, position) => acc + position.collateralUsd,
      0,
    );
    const borrowBalanceUsd = openCoreMarketPositions.reduce(
      (acc, position) => acc + position.borrowedUsd,
      0,
    );
    const vaultBalance = openVaultPositions.reduce(
      (acc, position) => acc + position.supplied.value,
      0,
    );
    const borrowAvailable = collateralBalanceUsd - borrowBalanceUsd;
    const collateralFactor = 1 -
      ((borrowBalanceUsd || 1) / (collateralBalanceUsd || 1));

    console.debug("------- Moonwell Summary -------");
    console.debug(`Address:            ${address}`);
    console.debug(`Vault Balance:      ${vaultBalance}`);
    console.debug(`Supply Balance:     $${supplyBalanceUsd}`);
    console.debug(`Collateral Balance: $${collateralBalanceUsd}`);
    console.debug(`Borrow Balance:     $${borrowBalanceUsd}`);
    console.debug(`Borrow Available:   $${borrowAvailable}`);
    console.debug(`Correlation Factor: ${collateralFactor}`);
    console.debug("--------------------------------");
  } else {
    throw new Error("Address invalid");
  }
} catch (error) {
  console.error(`Failed to process address ${ethAddress}:`, error);
}
