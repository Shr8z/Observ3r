import express, { Application, Request, Response } from "express";
import { Address, getAddress, isAddress, formatUnits, formatEther } from "viem";
import { MongoClient } from "mongodb";

import { MoonwellService } from "./Services/Moonwell/MoonwellService.ts";
import { ChainlinkService } from "./Services/Chainlink/ChainlinkService.ts";
import { BaseService } from "./Services/Base/BaseService.ts";
import { BaseTokens } from "./Services/Base/BaseTokens.ts";
import { AerodromeService } from "./Services/Aerodrome/AerodromeService.ts";
import { AerodromeSchema } from "./Services/Aerodrome/AerodromeSchema.ts";

const mongodbConnectionString = encodeURI(Deno.env.get("MONGODB_CONNECTION_STRING")!) || "";
if (!mongodbConnectionString) {
  throw new Error("MONGODB_CONNECTION_STRING is not set in environment variables");
}

const baseService = new BaseService();
const aerodromeService = new AerodromeService();
const moonwellService = new MoonwellService();
const chainlink = new ChainlinkService();
const dbClient = new MongoClient(mongodbConnectionString);

await dbClient.connect();

const db = dbClient.db("Observ3r");
const aerodromeCollection = db.collection<AerodromeSchema>("aerodrome");
// const moonwellCollection = db.collection<AerodromeSchema>("moonwell");

// const allAerodrome = await aerodromeCollection.find({ name: "deno" }).toArray();

// console.log(allAerodrome[0]._id);

const ethAddress = Deno.env.get("ETH_ADDRESS") || "0x";

const app: Application = express();

app.get("/", (_req: Request, res: Response) => {
  res.send("Welcome to the Dinosaur API!");
});

// GET http://localhost:8000/api/aerodrome/pool/0x4f09bab2f0e15e2a078a227fe1537665f55b8360?walletaddress=0xfbcbe7ad86b277a05fe260f037758cd5985e9c37 HTTP/1.1
app.get("/api/aerodrome/pool/:poolAddress", async (req: Request, res: Response) => {
  const poolAddress = req.params.poolAddress;
  const walletAddress: Address = getAddress(req.query.walletaddress as string);
  console.log(`START Processing Aerodrome Pool (${poolAddress}) for address: ${walletAddress}`);

  try {
    const poolData = await aerodromeService.getPoolGaugeData(poolAddress, walletAddress);
    const resPrice0 = await chainlink.getTokenPrice(poolData.token0) * Number(poolData.reserve0 / poolData.dec0);
    const resPrice1 = await chainlink.getTokenPrice(poolData.token1) * Number(poolData.reserve1 / poolData.dec1);
    const poolTVL = resPrice0 + resPrice1;
    const userShare = (Number(formatEther(poolData.balanceOf)) / Number(formatEther(poolData.totalSupply)));

    const poolReturn: AerodromeSchema = {
      timestamp: new Date(),
      blockNumber: Number(await baseService.getBlockNumber()),
      poolAddress: poolAddress,
      token0: poolData.token0,
      token1: poolData.token1,
      reserve0Price: resPrice0,
      reserve1Price: resPrice1,
      rewardToken: poolData.rewardToken,
      rewardEarned: Number(formatUnits(poolData.earned, BaseTokens.find(x => x.address == poolData.rewardToken)!.decimals)),
      poolTVL: poolTVL,
      userShare: userShare,
      marketPrice: userShare * poolTVL // = 0.0001578236630507249 but vfat indicate 0.00015410146155596743 deposit share >> vfat get res0 and res1 from pool balanceOf ERC20 calls
    };
    res.status(200).json(poolReturn);
    await aerodromeCollection.insertOne(poolReturn);
    console.log(`END Processing Aerodrome Pool (${poolAddress}) for address: ${walletAddress}`);
  } catch (error) {
    res.status(404).json({error: "Failed to fetch Pool Gauge Data", cause: error});
  }  
});

app.get("/api/moonwell", async (req: Request, res: Response) => {
  try {
    if (isAddress(req.query.walletaddress as string)) {
      const walletAddress: Address = getAddress(req.query.walletaddress as string);
      console.log(`Processing address: ${walletAddress}`);

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
      const collateralFactor = 1 -
        ((borrowBalanceUsd || 1) / (collateralBalanceUsd || 1));

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
    } else {
      res.status(404).send("Invalid or missing wallet address");
    }
  } catch (error) {
    console.error(`Failed to process address ${ethAddress}:`, error);
    res.status(404).send("Failed to process request");
  }
});

app.listen(8000);
console.log(`Server is running on http://localhost:8000`);
