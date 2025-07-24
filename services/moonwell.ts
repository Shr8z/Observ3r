import {
  createMoonwellClient,
  MorphoMarketUserPosition,
  MorphoVaultUserPosition,
  UserPosition,
  UserReward,
  Market
} from "@moonwell-fi/moonwell-sdk";
import { Address } from "viem";

export class MoonwellService {
  private moonwell = createMoonwellClient({
    networks: {
      base: {
        rpcUrls: ["https://mainnet.base.org"]
      }
    }
  });

  public async getUserPositions(address: Address): Promise<UserPosition[]> {
    try {
      const userPositions = await this.moonwell.getUserPositions({
        userAddress: address,
      });
      return userPositions;
    } catch (error) {
      console.error(`Error fetching positions for ${address}:`, error);
      throw error;
    }
  }

  public async getUserRewards(address: Address): Promise<UserReward[]> {
    try {
      const userPositions = await this.moonwell.getUserRewards({
        userAddress: address,
      });
      return userPositions;
    } catch (error) {
      console.error(`Error fetching positions for ${address}:`, error);
      throw error;
    }
  }

  public async getMorphoMarketUserPositions(address: Address): Promise<MorphoMarketUserPosition[]> {
    try {
      const marketPositions = await this.moonwell.getMorphoMarketUserPositions({
        userAddress: address,
      });
      return marketPositions;
    } catch (error) {
      console.error(`Error fetching positions for ${address}:`, error);
      throw error;
    }
  }

  public async getMorphoVaultUserPositions(address: Address): Promise<MorphoVaultUserPosition[]> {
    try {
      const vaultPositions = await this.moonwell.getMorphoVaultUserPositions({
        userAddress: address,
      });
      return vaultPositions;
    } catch (error) {
      console.error(`Error fetching positions for ${address}:`, error);
      throw error;
    }
  }

  public async getMarkets(): Promise<Market[]> {
    try {
      const markets = await this.moonwell.getMarkets({includeLiquidStakingRewards: true});
      return markets;
    } catch (error) {
      console.error(`Error fetching markets`, error);
      throw error;
    }
  }
}
