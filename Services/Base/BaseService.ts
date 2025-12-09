import { BaseTokens } from "./BaseTokens.ts";
import { createPublicClient, parseAbi, Address, http } from "viem";
import { base } from "viem/chains";
// import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

export class BaseService {

  private rpcUrl = Deno.env.get("RPC_URL") || "https://mainnet.base.org";

  private publicClient = createPublicClient({
    chain: base,
    transport: http(this.rpcUrl),
    batch: { multicall: { batchSize: 5, wait: 1000 } },
  });

  public async getBlockNumber() {
    return await this.publicClient.getBlockNumber();
  }

  public async getEthBalance(address: Address) {
    return await this.publicClient.getBalance({ address });
  }

  private erc20Abi = parseAbi([
    'function balanceOf(address owner) external view returns (uint256)'
  ])

  public async getTokensBalance(address: Address) {
    const results = await this.publicClient.multicall({
      contracts: BaseTokens.map(token => ({
        address: token.address,
        abi: this.erc20Abi,
        functionName: 'balanceOf',
        args: [address]
      }))
    })

    return {
      tokens: BaseTokens.map((token, i) => ({
        symbol: token.symbol,
        balance:  Number(results[i].result) / 10**token.decimals,
        address: token.address,
        name: token.name
      }))
    }
  }

  public async getTokenTransactions(account: Address, tokenAddress: Address) {
    // const lastBlock = await this.publicClient.getBlockNumber();
    const lastBlock = 36320477n;
    const transferEvent = parseAbi([
      'event Transfer(address indexed from, address indexed to, uint256 value)'
    ])[0];

    const [fromLogs, toLogs] = await Promise.all([
      this.publicClient.getLogs({
        address: tokenAddress,
        event: transferEvent,
        args: { from: account },
        fromBlock: lastBlock - 2000n,
        toBlock: lastBlock
      }),
      this.publicClient.getLogs({
        address: tokenAddress,
        event: transferEvent,
        args: { to: account },
        fromBlock: lastBlock - 2000n,
        toBlock: lastBlock
      })
    ]);

    const allLogs = [...fromLogs, ...toLogs];
    return allLogs.map(log => ({
      transactionHash: log.transactionHash,
      from: log.args.from,
      to: log.args.to,
      value: log.args.value
    }));
  }
}