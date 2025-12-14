import express, { Application, Request, Response } from "express";
import { Address, getAddress, isAddress, formatUnits, formatEther } from "viem";
import { Collection, Db, MongoClient } from "mongodb";
import { BaseService } from "./Services/Base/BaseService.ts";
import { BaseTokens } from "./Services/Base/BaseTokens.ts";
import { AerodromeService } from "./Services/Aerodrome/AerodromeService.ts";
import { AerodromeSchema } from "./Services/Aerodrome/AerodromeSchema.ts";
import { AerodromePoolGauge } from "./Services/Aerodrome/AerodromePoolGauge.ts";
import { MoonwellService } from "./Services/Moonwell/MoonwellService.ts";
import { MoonwellSchema } from "./Services/Moonwell/MoonwellSchema.ts";
import { ChainlinkService } from "./Services/Chainlink/ChainlinkService.ts";

const mongodbConnectionString = encodeURI(Deno.env.get("MONGODB_CONNECTION_STRING")!) || "";
if (!mongodbConnectionString) {
  throw new Error("MONGODB_CONNECTION_STRING is not set in environment variables");
}

const app: Application = express();
const baseService: BaseService = new BaseService();
const aerodromeService: AerodromeService = new AerodromeService();
const moonwellService: MoonwellService = new MoonwellService();
const chainlink: ChainlinkService = new ChainlinkService();
const dbClient: MongoClient = new MongoClient(mongodbConnectionString);

await dbClient.connect();

const db: Db = dbClient.db("Observ3r");
const aerodromeCollection: Collection<AerodromeSchema> = db.collection<AerodromeSchema>("aerodrome");
const moonwellCollection: Collection<MoonwellSchema> = db.collection<MoonwellSchema>("moonwell");

// const allAerodrome = await aerodromeCollection.find({ name: "deno" }).toArray();
// console.log(allAerodrome[0]._id);

app.get("/", (_req: Request, res: Response) => {
  res.send("Welcome to Observ3r API !");
});

app.get("/api/aerodrome/pool/:poolAddress", async (req: Request, res: Response) => {
  const uuid = crypto.randomUUID();
  if (isAddress(req.params.poolAddress as string) && isAddress(req.query.walletaddress as string)) {
    const poolAddress: Address = getAddress(req.params.poolAddress as string);
    const walletAddress: Address = getAddress(req.query.walletaddress as string);

    console.log(`[${uuid}] Fetching Aerodrome Pool (${poolAddress}) for Wallet (${walletAddress})`);
    const sickleAddress = await aerodromeService.getSickleContractAddress(walletAddress);
    if (sickleAddress) {
      console.log(`[${uuid}] Sickle Contract (${sickleAddress}) found for Wallet (${walletAddress})`);
    } else {
      console.log(`[${uuid}] No Sickle Contract found for (${walletAddress})`);
    }

    try {
      let poolData = await aerodromeService.getPoolGaugeData(poolAddress, walletAddress);
      if (poolData.balanceOf === 0n && sickleAddress) {
        poolData = await aerodromeService.getPoolGaugeData(poolAddress, sickleAddress);
        console.log(`[${uuid}] Fetching Aerodrome Pool (${poolAddress}) for Wallet (${walletAddress}) from Sickle Contract (${sickleAddress})`);
      }

      const price0 = await chainlink.getTokenPrice(poolData.token0);
      const price1 = await chainlink.getTokenPrice(poolData.token1);
      const resPrice0 = price0 * Number(poolData.reserve0 / poolData.dec0);
      const resPrice1 = price1 * Number(poolData.reserve1 / poolData.dec1);
      const poolTVL = resPrice0 + resPrice1;
      const userShare = (Number(formatEther(poolData.balanceOf)) / Number(formatEther(poolData.totalSupply)));

      const poolReturn: AerodromeSchema = {
        timestamp: new Date(),
        blockNumber: Number(await baseService.getBlockNumber()),
        poolName: AerodromePoolGauge.find(x => x.address.toLowerCase() === poolAddress.toLowerCase())?.name || "Unknown Pool",
        poolAddress: poolAddress,
        walletAddress: walletAddress,
        token0: poolData.token0,
        token1: poolData.token1,
        res0: Number(poolData.reserve0),
        res1: Number(poolData.reserve1),
        price0: price0,
        price1:  price1,
        rewardToken: poolData.rewardToken,
        rewardEarned: Number(formatUnits(poolData.earned, BaseTokens.find(x => x.address.toLowerCase() == poolData.rewardToken.toLowerCase())?.decimals ?? 18)),
        poolTVL: poolTVL,
        positionShare: userShare,
        positionPrice: userShare * poolTVL // = 0.0001578236630507249 but vfat indicate 0.00015410146155596743 deposit share >> vfat get res0 and res1 from pool balanceOf ERC20 calls
      };
      res.status(200).json(poolReturn);
      await aerodromeCollection.insertOne(poolReturn);
      console.log(`[${uuid}] Fetching Completed Aerodrome Pool (${poolAddress}) for Wallet (${walletAddress}) `);
    } catch (error) {
      res.status(404).json({error: "Failed to fetch Pool Gauge Data", cause: error});
    }
  } else {
    res.status(404).json({ error: "Invalid or missing pool / wallet address" });
    return;
  } 
});

app.get("/api/moonwell", async (req: Request, res: Response) => {
  if (isAddress(req.query.walletaddress as string)) {
    const walletAddress: Address = getAddress(req.query.walletaddress as string);
    console.log(`Processing address: ${walletAddress}`);
    try {    
      baseService.getTokensBalance(walletAddress).then(balance => {
        balance.tokens.filter(x => x.balance > 0).forEach(token => {
          console.log(`${token.symbol} Balance: ${token.balance}`);
        })
      });

      const coreMarketPositions = await moonwellService.getUserPositions(walletAddress);
      const openCoreMarketPositions = coreMarketPositions.filter((position) =>
        position.supplied.value > 0 || position.borrowed.value > 0
      );

      const rewards = await moonwellService.getUserRewards(walletAddress);
      const _openRewards = rewards.filter((reward) =>
        reward.supplyRewards.value > 0 || reward.borrowRewards.value > 0
      );

      const vaultPositions = await moonwellService.getMorphoVaultUserPositions(walletAddress);
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
      const collateralFactor = 1 - ((borrowBalanceUsd || 1) / (collateralBalanceUsd || 1));

      console.debug("------- Moonwell Summary -------");
      console.debug(`Address:            ${walletAddress}`);
      console.debug(`Vault Balance:      ${vaultBalance}`);
      console.debug(`Supply Balance:     $${supplyBalanceUsd}`);
      console.debug(`Collateral Balance: $${collateralBalanceUsd}`);
      console.debug(`Borrow Balance:     $${borrowBalanceUsd}`);
      console.debug(`Borrow Available:   $${borrowAvailable}`);
      console.debug(`Correlation Factor: ${collateralFactor}`);
      console.debug("--------------------------------");

      res.status(200).send("Done !");
    } catch (error) {
      console.error(`Failed to process address ${walletAddress}:`, error);
      res.status(404).send("Failed to process request");
    }
  } else {
    res.status(404).send("Invalid or missing wallet address");
  }
});

app.listen(8000);
console.log(`Server is running on http://localhost:8000`);
