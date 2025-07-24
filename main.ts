import { MoonwellService } from "./services/moonwell.ts";
import * as Gauge from "./metrics/gauge.ts";
import { register } from "prom-client";
import { Address, getAddress, isAddress } from "viem";
import { CronJob } from "cron";

const crontab = Deno.env.get("CRONTAB") || "* * * * *";
const service = new MoonwellService();

new CronJob(
  crontab,
  async () => {
    const ethAddress = Deno.env.get("ETH_ADDRESS") || "0x";
    try {
      if (isAddress(ethAddress)) {
        const address: Address = getAddress(ethAddress);

        const coreMarketPositions = await service.getUserPositions(address);
        const openCoreMarketPositions = coreMarketPositions.filter(position => position.supplied.value > 0 || position.borrowed.value > 0);
        openCoreMarketPositions.forEach(position => {
          if (position.supplied.value > 0) {
            Gauge.supplyBalance.set({address: address, token: position.market.symbol}, position.supplied.value);
            Gauge.supplyBalanceUsd.set({address: address, token: position.market.symbol}, position.suppliedUsd);
          }
          if (position.borrowed.value > 0) {
            Gauge.borrowBalance.set({ address: address, token: position.market.symbol }, position.borrowed.value);
            Gauge.borrowBalanceUsd.set({ address: address, token: position.market.symbol }, position.suppliedUsd);
          }
        });

        const rewards = await service.getUserRewards(address);
        const openRewards = rewards.filter(reward => reward.supplyRewards.value > 0 || reward.borrowRewards.value > 0);
        openRewards.forEach(reward => {
          Gauge.rewardBalance.set({address: address, token: reward.rewardToken.symbol}, reward.supplyRewards.value);
        });

        const vaultPositions = await service.getMorphoVaultUserPositions(address);
        const openVaultPositions = vaultPositions.filter(position => position.supplied.value > 0);
        openVaultPositions.forEach(position => {
          Gauge.vaultBalance.set({address: address, vault: position.vaultToken.symbol}, position.supplied.value);
        });

        const markets = await service.getMarkets();
        markets.forEach(market => {
          Gauge.marketSupplyAPY.set({market: market.marketKey, token: market.marketToken.symbol}, market.totalSupplyApr);
          Gauge.marketBorrowAPY.set({market: market.marketKey, token: market.marketToken.symbol}, market.totalBorrowApr);
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

        Gauge.correlationFactor.set({ address }, collateralFactor);
        Gauge.collateralBalanceUsd.set({ address }, collateralBalanceUsd);
        Gauge.borrowAvailableUsd.set({ address }, borrowAvailable);
        Gauge.borrowBalanceUsd.set({ address }, borrowBalanceUsd);
        Gauge.supplyBalanceUsd.set({ address }, supplyBalanceUsd);

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
