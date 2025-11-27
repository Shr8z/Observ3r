import { createPublicClient, http, parseAbi, Address } from 'viem';
import { base } from 'viem/chains';

export class AerodromeService {

  // Aerodrome Pool ABI (minimal for fetching pool data)
  private poolAbi = parseAbi([
    'function tokens() external view returns (address, address)',
    "function totalSupply() external view returns (uint256)",
    "function balanceOf(address account) external view returns (uint256)",
    'function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
  ]);

  // private nonfungiblePositionManagerAddress = '0x827922686190790b37229fd06084350E74485b72';

  // Initialize Viem client for Base network
  private rpcUrl = Deno.env.get("RPC_URL") || "https://mainnet.base.org";

  private publicClient = createPublicClient({
    chain: base,
    transport: http(this.rpcUrl),
    batch: { multicall: { batchSize: 5, wait: 1000 } },
  });

  // Function to fetch pool data
  public async getPoolData(poolAddress: Address, address: Address) {
    try {
      const results = await this.publicClient.multicall({
        contracts: [
          { address: poolAddress, abi: this.poolAbi, functionName: 'tokens' },
          { address: poolAddress, abi: this.poolAbi, functionName: 'getReserves' },
          { address: poolAddress, abi: this.poolAbi, functionName: 'totalSupply' },
          { address: poolAddress, abi: this.poolAbi, functionName: 'balanceOf', args: ['0xfbcbe7ad86b277a05fe260f037758cd5985e9c37'] }
        ],
        allowFailure: false,
      }) as [
          readonly [Address, Address], // tokens
          readonly [bigint, bigint, number], // getReserves
          bigint, // totalSupply
          bigint // balanceOf
        ];

      const [
        [token0, token1],
        [reserve0, reserve1, blockTimestampLast],
        totalSupply,
        balanceOf
      ] = results;

      return {
        token0,
        token1,
        reserve0,
        reserve1,
        blockTimestampLast,
        totalSupply,
        balanceOf
      };
    } catch (error) {
      console.error('Error fetching pool data:', error);
      throw error;
    }
  }
}