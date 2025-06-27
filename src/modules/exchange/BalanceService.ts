import { createClient } from 'redis';
import ConfigService from './ConfigService';

// Response type definitions for external APIs
interface BlockCypherResponse {
  final_balance: number;
  address: string;
  balance: number;
  total_received: number;
  total_sent: number;
  unconfirmed_balance: number;
  n_tx: number;
}

interface MempoolResponse {
  chain_stats: {
    funded_txo_sum: number;
    spent_txo_sum: number;
  };
  mempool_stats: {
    funded_txo_sum: number;
    spent_txo_sum: number;
  };
}

interface SolanaRpcResponse {
  jsonrpc: string;
  id: number;
  result: {
    value: number;
    context?: {
      slot: number;
    };
  };
  error?: {
    code: number;
    message: string;
  };
}

interface SolscanResponse {
  lamports: number;
  account: string;
  type: string;
}

export interface TokenBalance {
  address: string;
  balance: number;
}

// Add Etherscan API response interface
interface EtherscanResponse {
  status: string;
  message: string;
  result: string;
}

// Add Ethereum RPC response interface
interface EthereumRpcResponse {
  jsonrpc: string;
  id: number;
  result: string;
  error?: {
    code: number;
    message: string;
  };
}
    const redis = await createClient({ url: process.env.REDIS_URL }).connect();

export default class BalanceService {
  static async getCachedEthBalance(address: string): Promise<TokenBalance> {
    try {
      // Try to get cached data from Redis
      const cachedData = await redis.get(`eth_balance_${address}`);
      if (cachedData) {
        return JSON.parse(cachedData) as TokenBalance;
      }
    } catch (error) {
      console.error('Error fetching cached ETH balance from Redis:', error);
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
      console.error('Error fetching cached BTC balance from Redis:', error);
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
      console.error('Error fetching cached SOL balance from Redis:', error);
    }
    // If no cached data, fetch the latest balance
    return await this.getSolBalance(address);
  }

  static getBalances() {
    return {
      eth: this.getCachedEthBalance(ConfigService.wallets.ETH),
      btc: this.getCachedBtcBalance(ConfigService.wallets.BTC),
      sol: this.getCachedSolBalance(ConfigService.wallets.SOL),
    };
  }

  static async getEthBalance(address: string): Promise<TokenBalance> {
    try {
      // Try to fetch latest balance
      const balanceData = await this.fetchEthBalance(address);

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

  static async fetchEthBalance(address: string): Promise<TokenBalance> {
    try {
      // Using Etherscan API instead of Moralis
      const response = await fetch(
        `https://api.etherscan.io/api?module=account&action=balance&address=${address}&tag=latest&apikey=${process.env.ETHERSCAN_API_KEY}`,
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Etherscan API error: ${response.status} - ${errorText}`,
        );
      }

      const data = (await response.json()) as EtherscanResponse;

      if (data.status !== '1') {
        throw new Error(`Etherscan API error: ${data.message}`);
      }

      // Balance is in wei (divide by 10^18 to get ETH)
      return {
        address,
        balance: parseInt(data.result) / Math.pow(10, ConfigService.decimals.ETH),
      };
    } catch (error) {
      console.error('Error fetching ETH balance from Etherscan:', error);

      // Fallback to Ethereum RPC API if first attempt fails
      try {
        const rpcResponse = await fetch('https://eth.llamarpc.com', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'eth_getBalance',
            params: [address, 'latest'],
          }),
        });

        if (!rpcResponse.ok) {
          throw new Error(`Ethereum RPC API error: ${rpcResponse.status}`);
        }

        const rpcData = (await rpcResponse.json()) as EthereumRpcResponse;

        if (rpcData.error) {
          throw new Error(
            `Ethereum RPC error: ${JSON.stringify(rpcData.error)}`,
          );
        }

        // Convert hex result to decimal and then to ETH
        const balanceWei = parseInt(rpcData.result, 16);
        return {
          address,
          balance: balanceWei / Math.pow(10, ConfigService.decimals.ETH),
        };
      } catch (fallbackError) {
        console.error('Fallback API also failed:', fallbackError);
        throw error; // Throw the original error
      }
    }
  }

  static async getBtcBalance(address: string): Promise<TokenBalance> {

    try {
      // Try to fetch latest balance
      const balanceData = await this.fetchBtcBalance(address);

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

  static async fetchBtcBalance(address: string): Promise<TokenBalance> {
    try {
      // Using BlockCypher API instead - more reliable and with better documentation
      const response = await fetch(
        `https://api.blockcypher.com/v1/btc/main/addrs/${address}/balance`,
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `BlockCypher API error: ${response.status} - ${errorText}`,
        );
      }

      const data = (await response.json()) as BlockCypherResponse;

      // Balance is in satoshis (divide by 10^8 to get BTC)
      return {
        address,
        balance: data.final_balance / Math.pow(10, ConfigService.decimals.BTC),
      };
    } catch (error) {
      console.error('Error fetching BTC balance:', error);

      // Fallback to Mempool.space API if first attempt fails
      try {
        const mempoolResponse = await fetch(
          `https://mempool.space/api/address/${address}`,
        );

        if (!mempoolResponse.ok) {
          throw new Error(`Mempool API error: ${mempoolResponse.status}`);
        }

        const mempoolData = (await mempoolResponse.json()) as MempoolResponse;

        return {
          address,
          balance:
            mempoolData.chain_stats.funded_txo_sum -
            mempoolData.chain_stats.spent_txo_sum,
        };
      } catch (fallbackError) {
        console.error('Fallback API also failed:', fallbackError);
        throw error; // Throw the original error
      }
    }
  }

  static async getSolBalance(address: string): Promise<TokenBalance> {
    try {
      // Try to fetch latest balance
      const balanceData = await this.fetchSolBalance(address);

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

  static async fetchSolBalance(address: string): Promise<TokenBalance> {
    try {
      // Using Solana's public RPC API
      const response = await fetch('https://api.mainnet-beta.solana.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getBalance',
          params: [address],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Solana API error: ${response.status} - ${errorText}`);
      }

      const data = (await response.json()) as SolanaRpcResponse;

      if (data.error) {
        throw new Error(`Solana API error: ${JSON.stringify(data.error)}`);
      }

      // Balance is in lamports (divide by 10^9 to get SOL)
      return {
        address,
        balance: data.result.value / Math.pow(10, ConfigService.decimals.SOL),
      };
    } catch (error) {
      console.error('Error fetching SOL balance:', error);

      // Fallback to an alternative API
      try {
        // Using Solana Beach API as fallback
        const fallbackResponse = await fetch(
          `https://api.solscan.io/account?address=${address}`,
        );

        if (!fallbackResponse.ok) {
          throw new Error(`Fallback API error: ${fallbackResponse.status}`);
        }

        const fallbackData = (await fallbackResponse.json()) as SolscanResponse;

        return {
          address,
          balance: fallbackData.lamports / Math.pow(10, ConfigService.decimals.SOL),
        };
      } catch (fallbackError) {
        console.error('Fallback API also failed:', fallbackError);
        throw error; // Throw the original error
      }
    }
  }
}