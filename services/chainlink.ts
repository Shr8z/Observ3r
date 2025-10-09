import {
  formatEther,
  formatUnits,
  getAddress,
  parseAbi,
  http,
  createPublicClient,
} from "viem";
import { base } from "viem/chains";


export class ChainlinkService {
  private rpcUrl = Deno.env.get("RPC_URL") || "https://mainnet.base.org";

  private publicClient = createPublicClient({
    chain: base,
    transport: http(this.rpcUrl),
    batch: { multicall: { batchSize: 10, wait: 250 } },
  });

  private chainlinkDataFeedContracts = [
    {
      pair: "ETH/USD",
      address: "0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70",
      decimals: 8,
    },
    {
      pair: "BTC/USD",
      address: "0x64c911996D3c6aC71f9b455B1E8E7266BcbD848F",
      decimals: 8,
    },
  ];

  private chainlinkAbi = parseAbi([
    "function latestAnswer() view returns (int256)",
    "function decimals() view returns (uint8)",
  ]);

  private formatter = new Intl.DateTimeFormat("en-US", {
    dateStyle: "short",
    timeStyle: "medium",
  });

  public async getEthUsdPrice() {
    try {
      const contracts = this.chainlinkDataFeedContracts.map((contract) => ({
        address: getAddress(contract.address),
        abi: this.chainlinkAbi,
        functionName: "latestAnswer",
      }));

      const results = await this.publicClient.multicall({
        contracts: contracts,
      });

      this.chainlinkDataFeedContracts.map((contract, i) => {
        console.log(
          `${this.formatter.format(Date.now())} ${contract.pair} $${formatUnits(BigInt(results[i].result ?? 0n), contract.decimals)
          }`,
        );
      });
    } catch (error) {
      console.error("Error fetching data : ", error);
    }
  }
}
