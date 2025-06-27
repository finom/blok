import { KnownAny } from "vovk";
import ConfigService from "./ConfigService";

// Response type definitions for external APIs
export interface BlockCypherResponse {
  final_balance: number;
  address: string;
  balance: number;
  total_received: number;
  total_sent: number;
  unconfirmed_balance: number;
  n_tx: number;
}

export interface MempoolResponse {
  chain_stats: {
    funded_txo_sum: number;
    spent_txo_sum: number;
  };
  mempool_stats: {
    funded_txo_sum: number;
    spent_txo_sum: number;
  };
}

export interface SolanaRpcResponse {
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

export interface SolscanResponse {
  lamports: number;
  account: string;
  type: string;
}

export interface TokenBalance {
  address: string;
  balance: number;
}

// Add Etherscan API response interface
export interface EtherscanResponse {
  status: string;
  message: string;
  result: string;
}

// Add Ethereum RPC response interface
export interface EthereumRpcResponse {
  jsonrpc: string;
  id: number;
  result: string;
  error?: {
    code: number;
    message: string;
  };
}

// Add Cardano API response interfaces
export interface CardanoBlockfrostResponse {
  address: string;
  amount: Array<{
    unit: string;
    quantity: string;
  }>;
}

export interface CardanoKoiosResponse {
  address: string;
  balance: string;
}

// Add Avalanche API response interfaces
export interface AvalancheRpcResponse {
  jsonrpc: string;
  id: number;
  result: string;
  error?: {
    code: number;
    message: string;
  };
}

export interface SnowtraceResponse {
  status: string;
  message: string;
  result: string;
}

// Add CardanoScan API response interface
export interface CardanoScanResponse {
  address: string;
  balance: number; // In lovelaces
  transactions: number;
}

// Add AdaStat API response interface
export interface AdaStatResponse {
  balance: string; // In lovelaces
  stake_address: string;
  utxo_count: number;
}

// Add Cardanods API response interface
export interface CardanodsResponse {
  balance: number; // Balance in lovelaces
  address: string;
  transactions?: number;
  tokens?: KnownAny[]; // Optional tokens array if the API returns token info
}

export default class FetchService {
  static async fetchSolBalance(address: string): Promise<TokenBalance> {
    try {
      // Using Solana's public RPC API
      const response = await fetch("https://api.mainnet-beta.solana.com", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "getBalance",
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
      console.error("Error fetching SOL balance:", error);

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
          balance:
            fallbackData.lamports / Math.pow(10, ConfigService.decimals.SOL),
        };
      } catch (fallbackError) {
        console.error("Fallback API also failed:", fallbackError);
        throw error; // Throw the original error
      }
    }
  }

  static async fetchAdaBalance(address: string): Promise<TokenBalance> {
    try {
      // Using CardanoScan API as primary source
      const response = await fetch(
        `https://api.cardanoscan.io/api/v1/address/balance?address=${address}`,
        {
          headers: {
            apiKey: process.env.CARDANOSCAN_API_KEY || "",
          },
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `CardanoScan API error: ${response.status} - ${errorText}`,
        );
      }

      const data = (await response.json()) as CardanoScanResponse;

      // Balance is in lovelaces (divide by 10^6 to get ADA)
      return {
        address,
        balance: data.balance / Math.pow(10, ConfigService.decimals.ADA),
      };
    } catch (error) {
      console.error("Error fetching ADA balance from CardanoScan:", error);

      // Fallback to Blockfrost API
      try {
        const blockfrostResponse = await fetch(
          `https://cardano-mainnet.blockfrost.io/api/v0/addresses/${address}`,
          {
            headers: {
              project_id: process.env.BLOCKFROST_PROJECT_ID || "",
            },
          },
        );

        if (!blockfrostResponse.ok) {
          throw new Error(`Blockfrost API error: ${blockfrostResponse.status}`);
        }

        const blockfrostData =
          (await blockfrostResponse.json()) as CardanoBlockfrostResponse;

        // Find the lovelace amount (native ADA) in the response
        const lovelaceAmount = blockfrostData.amount.find(
          (asset) => asset.unit === "lovelace",
        );

        if (!lovelaceAmount) {
          throw new Error("No lovelace balance found in Blockfrost response");
        }

        return {
          address,
          balance:
            Number(lovelaceAmount.quantity) /
            Math.pow(10, ConfigService.decimals.ADA),
        };
      } catch (fallbackError) {
        console.error("Fallback API also failed:", fallbackError);
        throw error; // Throw the original error
      }
    }
  }

  static async fetchAvaxBalance(address: string): Promise<TokenBalance> {
    try {
      // Using Snowtrace API (Avalanche's Etherscan equivalent)
      const response = await fetch(
        `https://api.snowtrace.io/api?module=account&action=balance&address=${address}&tag=latest&apikey=${process.env.SNOWTRACE_API_KEY}`,
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Snowtrace API error: ${response.status} - ${errorText}`,
        );
      }

      const data = (await response.json()) as SnowtraceResponse;

      if (data.status !== "1") {
        throw new Error(`Snowtrace API error: ${data.message}`);
      }

      // Balance is in wei (divide by 10^18 to get AVAX)
      return {
        address,
        balance:
          parseInt(data.result) / Math.pow(10, ConfigService.decimals.AVAX),
      };
    } catch (error) {
      console.error("Error fetching AVAX balance from Snowtrace:", error);

      // Fallback to Avalanche RPC API
      try {
        const rpcResponse = await fetch(
          "https://api.avax.network/ext/bc/C/rpc",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              jsonrpc: "2.0",
              id: 1,
              method: "eth_getBalance",
              params: [address, "latest"],
            }),
          },
        );

        if (!rpcResponse.ok) {
          throw new Error(`Avalanche RPC API error: ${rpcResponse.status}`);
        }

        const rpcData = (await rpcResponse.json()) as AvalancheRpcResponse;

        if (rpcData.error) {
          throw new Error(
            `Avalanche RPC error: ${JSON.stringify(rpcData.error)}`,
          );
        }

        // Convert hex result to decimal and then to AVAX
        const balanceWei = parseInt(rpcData.result, 16);
        return {
          address,
          balance: balanceWei / Math.pow(10, ConfigService.decimals.AVAX),
        };
      } catch (fallbackError) {
        console.error("Fallback API also failed:", fallbackError);
        throw error; // Throw the original error
      }
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
      console.error("Error fetching BTC balance:", error);

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
        console.error("Fallback API also failed:", fallbackError);
        throw error; // Throw the original error
      }
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

      if (data.status !== "1") {
        throw new Error(`Etherscan API error: ${data.message}`);
      }

      // Balance is in wei (divide by 10^18 to get ETH)
      return {
        address,
        balance:
          parseInt(data.result) / Math.pow(10, ConfigService.decimals.ETH),
      };
    } catch (error) {
      console.error("Error fetching ETH balance from Etherscan:", error);

      // Fallback to Ethereum RPC API if first attempt fails
      try {
        const rpcResponse = await fetch("https://eth.llamarpc.com", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "eth_getBalance",
            params: [address, "latest"],
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
        console.error("Fallback API also failed:", fallbackError);
        throw error; // Throw the original error
      }
    }
  }
}
