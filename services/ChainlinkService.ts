import {
Address,
  createPublicClient,
  formatEther,
  formatUnits,
  getAddress,
  http,
  parseAbi,
} from "viem";
import { base } from "viem/chains";
import { DataFeeds } from "../data/DataFeeds.ts";

export class ChainlinkService {
  private rpcUrl = Deno.env.get("RPC_URL") || "https://mainnet.base.org";

  private publicClient = createPublicClient({
    chain: base,
    transport: http(this.rpcUrl),
    batch: { multicall: { batchSize: 5, wait: 1000 } },
  });

  private chainlinkAbi = parseAbi([
    "function latestAnswer() view returns (int256)",
    "function decimals() view returns (uint8)",
  ]);

  private formatter = new Intl.DateTimeFormat("en-US", {
    dateStyle: "short",
    timeStyle: "medium",
  });

  public async getPairPrice() {
    try {
      const contracts = DataFeeds.map((contract) => ({
        address: getAddress(contract.address),
        abi: this.chainlinkAbi,
        functionName: "latestAnswer",
      }));

      const results = await this.publicClient.multicall({
        contracts: contracts,
      });

      DataFeeds.map((contract, i) => {
        console.log(`${contract.pair} $${formatUnits(BigInt(results[i].result ?? 0n), contract.decimals)}`);
      });
    } catch (error) {
      console.error("Error fetching data : ", error);
    }
  }

  public async getTokenPrice(tokenAddress: Address): Promise<number> {
    try {
      const feed = DataFeeds.find(
        (feed) => feed.tokenAddress.toLowerCase() === tokenAddress.toLowerCase(),
      );
      if (!feed) {
        throw new Error(`No data feed found for token address: ${tokenAddress}`);
      }

      const [latestAnswer] = await this.publicClient.multicall({
        contracts: [
          {
            address: getAddress(feed.address),
            abi: this.chainlinkAbi,
            functionName: "latestAnswer",
          },
        ],
      });

      const price = Number(formatUnits(BigInt(latestAnswer.result ?? 0n), feed.decimals));
      return price;
    } catch (error) {
      throw new Error("Failed to fetch token price ${tokenAddress}", { cause: error } );
    }
  }
}
