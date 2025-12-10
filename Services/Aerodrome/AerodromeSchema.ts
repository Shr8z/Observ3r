import { Address } from "viem";

export interface AerodromeSchema {
  timestamp: Date;
  poolName: string;
  poolAddress: Address;
  walletAddress: Address;
  blockNumber: number;
  token0: string;
  token1: string;
  res0: number;
  res1: number;
  price0: number;
  price1: number;
  rewardToken: string;
  rewardEarned: number;
  poolTVL: number;
  positionShare: number;
  positionPrice: number;
}