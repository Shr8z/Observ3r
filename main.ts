import { MoonwellService } from "./services/moonwell.ts";
import { ChainlinkService } from "./services/chainlink.ts";
import { BaseService } from "./services/base.ts";
import * as MoonwellGauge from "./metrics/moonwell_gauge.ts";
import * as BaseGauge from "./metrics/base_gauge.ts";
import { register } from "prom-client";
import { Address, getAddress, isAddress, formatEther } from "viem";
import { CronJob } from "cron";

const crontab = Deno.env.get("CRONTAB") || "*/10 * * * * *";
const rpcUrl = Deno.env.get("RPC_URL") || "https://mainnet.base.org";

const baseService = new BaseService();
const moonwellService = new MoonwellService();
const chainlink = new ChainlinkService();

new CronJob(
  crontab,
  async () => {
    const ethAddress = Deno.env.get("ETH_ADDRESS") || "0x";
    try {
      if (isAddress(ethAddress)) {
        const address: Address = getAddress(ethAddress);

        baseService.getBaseBalances(address).then(balance => {
          balance.tokens.filter(x => x.balance > 0).forEach(token => {
            console.log(`${token.symbol} Balance: ${token.balance}`);
            BaseGauge.token_balance.set({ address: address, token: token.symbol }, Number(token.balance) / Math.pow(10, 18));
          })
        });

        const coreMarketPositions = await moonwellService.getUserPositions(address);
        const openCoreMarketPositions = coreMarketPositions.filter(position => position.supplied.value > 0 || position.borrowed.value > 0);
        openCoreMarketPositions.forEach(position => {
          if (position.supplied.value > 0) {
            MoonwellGauge.supplyBalance.set({ address: address, token: position.market.symbol }, position.supplied.value);
            MoonwellGauge.supplyBalanceUsd.set({ address: address, token: position.market.symbol }, position.suppliedUsd);
          }
          if (position.borrowed.value > 0) {
            MoonwellGauge.borrowBalance.set({ address: address, token: position.market.symbol }, position.borrowed.value);
            MoonwellGauge.borrowBalanceUsd.set({ address: address, token: position.market.symbol }, position.suppliedUsd);
          }
        });

        const rewards = await moonwellService.getUserRewards(address);
        const openRewards = rewards.filter(reward => reward.supplyRewards.value > 0 || reward.borrowRewards.value > 0);
        openRewards.forEach(reward => {
          MoonwellGauge.rewardBalance.set({ address: address, token: reward.rewardToken.symbol }, reward.supplyRewards.value);
        });

        const vaultPositions = await moonwellService.getMorphoVaultUserPositions(address);
        const openVaultPositions = vaultPositions.filter(position => position.supplied.value > 0);
        openVaultPositions.forEach(position => {
          MoonwellGauge.vaultBalance.set({ address: address, vault: position.vaultToken.symbol }, position.supplied.value);
        });

        const markets = await moonwellService.getMarkets();
        markets.forEach(market => {
          MoonwellGauge.marketSupplyAPY.set({ market: market.marketKey, token: market.marketToken.symbol }, market.totalSupplyApr);
          MoonwellGauge.marketBorrowAPY.set({ market: market.marketKey, token: market.marketToken.symbol }, market.totalBorrowApr);
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
        const collateralFactor = 1 - ((borrowBalanceUsd || 1) / (collateralBalanceUsd || 1));

        MoonwellGauge.correlationFactor.set({ address }, collateralFactor);
        MoonwellGauge.collateralBalanceUsd.set({ address }, collateralBalanceUsd);
        MoonwellGauge.borrowAvailableUsd.set({ address }, borrowAvailable);
        MoonwellGauge.borrowBalanceUsd.set({ address }, borrowBalanceUsd);
        MoonwellGauge.supplyBalanceUsd.set({ address }, supplyBalanceUsd);

        // Get the ETH/USD price
        await chainlink.getEthUsdPrice();

        console.debug(`Address:            ${address}`);
        console.debug(`Vault Balance:      ${vaultBalance}`);
        console.debug(`Supply Balance:     $${supplyBalanceUsd}`);
        console.debug(`Collateral Balance: $${collateralBalanceUsd}`);
        console.debug(`Borrow Balance:     $${borrowBalanceUsd}`);
        console.debug(`Borrow Available:   $${borrowAvailable}`);
        console.debug(`Correlation Factor: ${collateralFactor}`);
        console.debug('---------------------------------------');

      } else {
        throw new Error("Address invalid");
      }
    } catch (error) {
      console.error(`Failed to process address ${ethAddress}:`, error);
    }
  },
  null,
  true,
  "utc",
);

Deno.serve(
  { port: 8080, hostname: "0.0.0.0" },
  async (req) => {
    const url = new URL(req.url);
    if (url.pathname === "/metrics") {
      try {
        return new Response(await register.metrics(), {
          status: 200,
          headers: {
            "Content-Type": register.contentType,
          },
        });
      } catch (_err) {
        return new Response("", {
          status: 500,
        });
      }
    } else {
      return new Response("NOT FOUND", {
        status: 404,
      });
    }
  },
);
