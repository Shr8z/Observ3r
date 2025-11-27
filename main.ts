import { MoonwellService } from "./services/moonwell.ts";
import { ChainlinkService } from "./services/chainlink.ts";
import { BaseService } from "./services/base.ts";
import { AerodromeService } from "./services/aerodrome.ts";
import { BaseTokens } from "./data/Tokens.ts";
// import * as MoonwellGauge from "./metrics/moonwell_gauge.ts";
// import * as BaseGauge from "./metrics/base_gauge.ts";
import { Address, getAddress, isAddress } from "viem";

const baseService = new BaseService();
const aerodromeService = new AerodromeService();
const moonwellService = new MoonwellService();
const chainlink = new ChainlinkService();

const ethAddress = Deno.env.get("ETH_ADDRESS") || "0x";
try {
  if (isAddress(ethAddress)) {
    const address: Address = getAddress(ethAddress);
    const ethBalance = await baseService.getEthBalance(address);

    // baseService.getTokenTransactions(address, BaseTokens.find(x => x.symbol == "VVV")!.address).then(c => {
    //   const i = c.forEach(x => {
    //     console.log(x.transactionHash);
    //   });
    // });

    baseService.getTokensBalance(address).then(balance => {
      balance.tokens.filter(x => x.balance > 0).forEach(token => {
        console.log(`${token.symbol} Balance: ${Number(token.balance) / Math.pow(10, 18)}`);
      })
    });

    const AERODROME_POOL_ADDRESS: Address =
      "0x6cdcb1c4a4d1c3c6d054b27ac5b77e89eafb971d" as Address; // Replace with actual pool address

    try {
      const poolData = await aerodromeService.getPoolData(
        AERODROME_POOL_ADDRESS,
        address,
      );
      console.log("Aerodrome Pool Data:", poolData);
    } catch (error) {
      console.error("Failed to fetch pool data:", error);
    }
    const coreMarketPositions = await moonwellService.getUserPositions(address);
    const openCoreMarketPositions = coreMarketPositions.filter((position) =>
      position.supplied.value > 0 || position.borrowed.value > 0
    );
    openCoreMarketPositions.forEach((position) => {
      if (position.supplied.value > 0) {
        
      }
      if (position.borrowed.value > 0) {
        
      }
    });

    const rewards = await moonwellService.getUserRewards(address);
    const openRewards = rewards.filter((reward) =>
      reward.supplyRewards.value > 0 || reward.borrowRewards.value > 0
    );
    openRewards.forEach((reward) => {
      
    });

    const vaultPositions = await moonwellService.getMorphoVaultUserPositions(
      address,
    );
    const openVaultPositions = vaultPositions.filter((position) =>
      position.supplied.value > 0
    );
    openVaultPositions.forEach((position) => {
      
    });

    const markets = await moonwellService.getMarkets();
    markets.forEach((market) => {
      
    });

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
    console.debug("---------------------------------------");

    // Get the ETH/USD price
    await chainlink.getEthUsdPrice();
  } else {
    throw new Error("Address invalid");
  }
} catch (error) {
  console.error(`Failed to process address ${ethAddress}:`, error);
}
