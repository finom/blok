
import { KnownAny } from "vovk";

interface WalletInput {
  [currency: string]: string;
}

interface ExchangeInfo {
  exchangeName: string;
  exchangeRate: number | null;
}

interface WalletData {
  wallet: string;
  balance: number;
  exchanges: ExchangeInfo[];
  calculatedValue: number;
  error?: string;
}

interface WalletOutput {
  [currency: string]: WalletData;
}

export async function getExchangeValue(wallets: WalletInput): Promise<WalletOutput> {
  const result: WalletOutput = {};
  
  for (const [currency, walletAddress] of Object.entries(wallets)) {
    try {

      const balance = await getWalletBalance(currency, walletAddress);

      const exchanges = (await getExchangeRates(currency)).filter(({ exchangeRate }) => typeof exchangeRate === 'number' && exchangeRate > 0);

      if (exchanges.length === 0) {
        throw new Error(`No exchange rates found for ${currency}`);
      }

      const averageRate = exchanges.reduce((sum, exchange) => sum + exchange.exchangeRate!, 0) / exchanges.length;

      const calculatedValue = balance * averageRate;
      

      result[currency] = {
        wallet: walletAddress,
        balance,
        exchanges,
        calculatedValue
      };
    } catch (error) {
      console.error(`Failed to process ${currency} wallet ${walletAddress}:`, error);
      result[currency] = {
        wallet: walletAddress,
        balance: 0,
        exchanges: [],
        calculatedValue: 0,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  return result;
}

/**
 * Gets the balance of a cryptocurrency wallet
 */
export async function getWalletBalance(currency: string, walletAddress: string): Promise<number> {
  switch (currency.toUpperCase()) {
    case 'BTC':
      return await getBitcoinBalance(walletAddress);
    case 'ETH':
      return await getEthereumBalance(walletAddress);
    case 'SOL':
      return await getSolanaBalance(walletAddress);
    default:
      throw new Error(`Unsupported currency: ${currency}`);
  }
}

/**
 * Gets exchange rates for a cryptocurrency from various exchanges
 */
export async function getExchangeRates(currency: string): Promise<ExchangeInfo[]> {
  const exchanges = ['binance', 'coinbase'];
  
  const results = await Promise.all(
    exchanges.map(async (exchangeName) => {
      try {
        const rate = await getExchangeRate(currency, exchangeName);
        return {
          exchangeName,
          exchangeRate: rate
        };
      } catch (error) {
        console.error(`Failed to get rate from ${exchangeName} for ${currency}:`, error);
        return null;
      }
    })
  ); 
  return results.filter((result): result is ExchangeInfo => result !== null);
}

async function getBitcoinBalance(address: string): Promise<number> {
  const endpoints = [
    {
      url: `https://blockstream.info/api/address/${address}`,
      processResponse: (data: KnownAny) => {
        const chainStats = data.chain_stats;
        const balanceSat = chainStats.funded_txo_sum - chainStats.spent_txo_sum;
        return balanceSat / 100000000; // Convert satoshis to BTC
      }
    },
    {
      url: `https://mempool.space/api/address/${address}`,
      processResponse: (data: KnownAny) => {
        return data.chain_stats.funded_txo_sum - data.chain_stats.spent_txo_sum / 100000000;
      }
    },
    {
      url: `https://blockchain.info/rawaddr/${address}?limit=0`,
      processResponse: (data: KnownAny) => {
        return data.final_balance / 100000000; // Convert satoshis to BTC
      }
    }
  ];
  
  let lastError: Error | null = null;
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint.url, {
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      return endpoint.processResponse(data);
      
    } catch (error) {
      console.error(`Error fetching Bitcoin balance from ${endpoint.url}:`, error);
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }
  
  throw new Error(`Failed to get Bitcoin balance: ${lastError?.message || 'Unknown error'}`);
}

async function getEthereumBalance(address: string): Promise<number> {
  const rpcEndpoints = [
    'https://eth-mainnet.public.blastapi.io',
    'https://ethereum.publicnode.com',
    'https://rpc.ankr.com/eth',
    'https://cloudflare-eth.com'
  ];
  
  let lastError: Error | null = null;
  
  // Try each endpoint until one succeeds
  for (const endpoint of rpcEndpoints) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_getBalance',
          params: [address, 'latest']
        }),
        signal: AbortSignal.timeout(5000)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json() as KnownAny;
      
      if (data.error) {
        throw new Error(`RPC error: ${data.error.message || JSON.stringify(data.error)}`);
      }
      
      if (!data.result) {
        throw new Error(`Invalid response: missing result field`);
      }
      
      // Convert hex string to decimal and then from wei to ETH
      const balanceInWei = parseInt(data.result, 16);
      return balanceInWei / 1e18;
    } catch (error) {
      console.error(`Error fetching Ethereum balance from ${endpoint}:`, error);
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }
  
  throw new Error(`Failed to get Ethereum balance: ${lastError?.message || 'Unknown error'}`);
}

async function getSolanaBalance(address: string): Promise<number> {
  try {
    const response = await fetch('https://api.mainnet-beta.solana.com', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getBalance',
        params: [address]
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json() as KnownAny;
    // Convert lamports to SOL
    return data.result.value / 1e9;
  } catch (error) {
    console.error('Error fetching Solana balance:', error);
    throw new Error(`Failed to get Solana balance: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function getExchangeRate(currency: string, exchange: string): Promise<number | null> {
  try {
    const symbol = `${currency.toUpperCase()}USDT`;
    switch (exchange.toLowerCase()) {
      case 'binance':
        const binanceResponse = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`);
        if (!binanceResponse.ok) {
          return null;
        }
        const binanceData = await binanceResponse.json() as KnownAny;
        return parseFloat(binanceData.price);
        
      case 'coinbase':
        const coinbaseResponse = await fetch(`https://api.coinbase.com/v2/exchange-rates?currency=${currency.toUpperCase()}`);
        if (!coinbaseResponse.ok) {
          return null;
        }
        const coinbaseData = await coinbaseResponse.json() as KnownAny;
        return parseFloat(coinbaseData.data.rates.USD);

      default:
        throw new Error(`Unsupported exchange: ${exchange}`);
    }
  } catch (error) {
    console.error(`Error fetching ${currency} rate from ${exchange}:`, error);
    throw new Error(`Failed to get exchange rate: ${error instanceof Error ? error.message : String(error)}`);
  }
}
