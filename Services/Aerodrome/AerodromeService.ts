import { createPublicClient, http, parseAbi, Address } from 'viem';
import { base } from 'viem/chains';

export class AerodromeService {

  // Aerodrome Pool Gauge ABI (minimal for fetching pool data)
  private poolGaugeAbi = parseAbi([
    'function rewardToken() external view returns (address)',
    'function earned(address _account) external view returns (uint256 _earned)',
    'function balanceOf(address account) external view returns (uint256)',
    'function totalSupply() external view returns (uint256)',
    'function stakingToken() external view returns (address)',
  ]);

  // Aerodrome Pool ABI (minimal for fetching pool data)
  private poolAbi = parseAbi([
    'function metadata() external view returns (uint256 dec0, uint256 dec1, uint256 r0, uint256 r1, bool st, address t0, address t1)',
  ]);

  // Initialize Viem client for Base network
  private rpcUrl = Deno.env.get("RPC_URL") || "https://mainnet.base.org";

  private publicClient = createPublicClient({
    chain: base,
    transport: http(this.rpcUrl),
    batch: { multicall: { batchSize: 5, wait: 1000 } },
  });

  /* Function to fetch pool data
  // vAMM-USDC/AERO Pool Gauge = 0x4f09bab2f0e15e2a078a227fe1537665f55b8360
  // Call balanceOf() to get staked balance
  // Call earned() to get pending rewards
  // Call rewardToken() to get the reward token address
  // Call stakingToken() to get the pool address

  // vAMM-USDC/AERO Pool = 0x6cdcb1c4a4d1c3c6d054b27ac5b77e89eafb971d
  // Call metadata() to get token0 address, token1 address, reserve0, reserve1 
  */
  public async getPoolGaugeData(poolAddress: Address, address: Address) {
    try {
      const [ stakingToken, rewardToken, earned, balanceOf, totalSupply ] = await this.publicClient.multicall({
        contracts: [
          { address: poolAddress, abi: this.poolGaugeAbi, functionName: 'stakingToken' },
          { address: poolAddress, abi: this.poolGaugeAbi, functionName: 'rewardToken' },
          { address: poolAddress, abi: this.poolGaugeAbi, functionName: 'earned', args: [address] },
          { address: poolAddress, abi: this.poolGaugeAbi, functionName: 'balanceOf', args: [address]},
          { address: poolAddress, abi: this.poolGaugeAbi, functionName: 'totalSupply'}
        ],
        allowFailure: false,
      }) as [ Address, Address, bigint, bigint, bigint];

      const [[dec0, dec1, reserve0, reserve1, _staked, token0, token1]] = await this.publicClient.multicall({
        contracts: [
          { address: stakingToken, abi: this.poolAbi, functionName: 'metadata' }
        ],
        allowFailure: false,
      }) as [readonly [bigint, bigint, bigint, bigint, boolean, Address, Address]];

      return { token0, dec0, token1, dec1, reserve0, reserve1, earned, stakingToken, rewardToken, balanceOf, totalSupply };
    } catch (error) {
      throw new Error("Error fetching pool data", { cause: error } );
    }
  }
}