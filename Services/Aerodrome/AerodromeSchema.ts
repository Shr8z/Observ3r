import { Address } from "viem";

export interface AerodromeSchema {
  timestamp: Date;
  poolAddress: Address;
  blockNumber: number;
  token0: string;
  token1: string;
  reserve0Price: number;
  reserve1Price: number;
  rewardToken: string;
  rewardEarned: number;
  poolTVL: number;
  userShare: number;
  marketPrice: number;
}