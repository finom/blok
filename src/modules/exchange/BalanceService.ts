import { createClient } from "redis";
import ConfigService from "./ConfigService";
import FetchService, { TokenBalance } from "./FetchService";

const redis = await createClient({ url: process.env.REDIS_URL }).connect();

export default class BalanceService {
  static async getCachedAllBalances() {
    return {
      ETH: await this.getCachedEthBalance(ConfigService.wallets.ETH),
      BTC: await this.getCachedBtcBalance(ConfigService.wallets.BTC),
      SOL: await this.getCachedSolBalance(ConfigService.wallets.SOL),
      ADA: await this.getCachedAdaBalance(ConfigService.wallets.ADA),
      AVAX: await this.getCachedAvaxBalance(ConfigService.wallets.AVAX),
    };
  }

  static async getCachedEthBalance(address: string): Promise<TokenBalance> {
    try {
      // Try to get cached data from Redis
      const cachedData = await redis.get(`eth_balance_${address}`);
      if (cachedData) {
        return JSON.parse(cachedData) as TokenBalance;
      }
    } catch (error) {
      console.error("Error fetching cached ETH balance from Redis:", error);
    }
    // If no cached data, fetch the latest balance
    return await this.getEthBalance(address);
  }

  static async getCachedBtcBalance(address: string): Promise<TokenBalance> {
    try {
      // Try to get cached data from Redis
      const cachedData = await redis.get(`btc_balance_${address}`);
      if (cachedData) {
        return JSON.parse(cachedData) as TokenBalance;
      }
    } catch (error) {
      console.error("Error fetching cached BTC balance from Redis:", error);
    }
    // If no cached data, fetch the latest balance
    return await this.getBtcBalance(address);
  }

  static async getCachedSolBalance(address: string): Promise<TokenBalance> {
    try {
      // Try to get cached data from Redis
      const cachedData = await redis.get(`sol_balance_${address}`);
      if (cachedData) {
        return JSON.parse(cachedData) as TokenBalance;
      }
    } catch (error) {
      console.error("Error fetching cached SOL balance from Redis:", error);
    }
    // If no cached data, fetch the latest balance
    return await this.getSolBalance(address);
  }

  static async getCachedAdaBalance(address: string): Promise<TokenBalance> {
    try {
      // Try to get cached data from Redis
      const cachedData = await redis.get(`ada_balance_${address}`);
      if (cachedData) {
        return JSON.parse(cachedData) as TokenBalance;
      }
    } catch (error) {
      console.error("Error fetching cached ADA balance from Redis:", error);
    }
    // If no cached data, fetch the latest balance
    return await this.getAdaBalance(address);
  }

  static async getCachedAvaxBalance(address: string): Promise<TokenBalance> {
    try {
      // Try to get cached data from Redis
      const cachedData = await redis.get(`avax_balance_${address}`);
      if (cachedData) {
        return JSON.parse(cachedData) as TokenBalance;
      }
    } catch (error) {
      console.error("Error fetching cached AVAX balance from Redis:", error);
    }
    // If no cached data, fetch the latest balance
    return await this.getAvaxBalance(address);
  }

  static async getEthBalance(address: string): Promise<TokenBalance> {
    try {
      // Try to fetch latest balance
      const balanceData = await FetchService.fetchEthBalance(address);

      // Cache the result in Redis
      await redis.set(`eth_balance_${address}`, JSON.stringify(balanceData));

      return balanceData;
    } catch (error) {
      // If fetch fails, try to get cached data from Redis
      const cachedData = await redis.get(`eth_balance_${address}`);

      if (cachedData) {
        return JSON.parse(cachedData) as TokenBalance;
      }

      // If no cached data, re-throw the original error
      throw error;
    }
  }

  static async getBtcBalance(address: string): Promise<TokenBalance> {
    try {
      // Try to fetch latest balance
      const balanceData = await FetchService.fetchBtcBalance(address);

      // Cache the result in Redis
      await redis.set(`btc_balance_${address}`, JSON.stringify(balanceData));

      return balanceData;
    } catch (error) {
      // If fetch fails, try to get cached data from Redis
      const cachedData = await redis.get(`btc_balance_${address}`);

      if (cachedData) {
        return JSON.parse(cachedData) as TokenBalance;
      }

      // If no cached data, re-throw the original error
      throw error;
    }
  }

  static async getSolBalance(address: string): Promise<TokenBalance> {
    try {
      // Try to fetch latest balance
      const balanceData = await FetchService.fetchSolBalance(address);

      // Cache the result in Redis
      await redis.set(`sol_balance_${address}`, JSON.stringify(balanceData));

      return balanceData;
    } catch (error) {
      // If fetch fails, try to get cached data from Redis
      const cachedData = await redis.get(`sol_balance_${address}`);

      if (cachedData) {
        return JSON.parse(cachedData) as TokenBalance;
      }

      // If no cached data, re-throw the original error
      throw error;
    }
  }

  static async getAdaBalance(address: string): Promise<TokenBalance> {
    try {
      // Try to fetch latest balance
      const balanceData = await FetchService.fetchAdaBalance(address);

      // Cache the result in Redis
      await redis.set(`ada_balance_${address}`, JSON.stringify(balanceData));

      return balanceData;
    } catch (error) {
      // If fetch fails, try to get cached data from Redis
      const cachedData = await redis.get(`ada_balance_${address}`);

      if (cachedData) {
        return JSON.parse(cachedData) as TokenBalance;
      }

      // If no cached data, re-throw the original error
      throw error;
    }
  }

  static async getAvaxBalance(address: string): Promise<TokenBalance> {
    try {
      // Try to fetch latest balance
      const balanceData = await FetchService.fetchAvaxBalance(address);

      // Cache the result in Redis
      await redis.set(`avax_balance_${address}`, JSON.stringify(balanceData));

      return balanceData;
    } catch (error) {
      // If fetch fails, try to get cached data from Redis
      const cachedData = await redis.get(`avax_balance_${address}`);

      if (cachedData) {
        return JSON.parse(cachedData) as TokenBalance;
      }

      // If no cached data, re-throw the original error
      throw error;
    }
  }
}
