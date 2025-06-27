import { createClient } from "redis";

// Replace CoinGecko interface with CoinMarketCap interface
interface CoinMarketCapResponse {
  data: {
    [symbol: string]: {
      id: number;
      name: string;
      symbol: string;
      quote: {
        USD: {
          price: number;
        };
      };
    };
  };
}

const redis = await createClient({ url: process.env.REDIS_URL }).connect();

export default class PriceService {
  static async getCachedPrice() {
    try {
      // Try to get cached data from Redis
      const cachedData = await redis.get("price_data");
      if (cachedData) {
        return JSON.parse(cachedData) as CoinMarketCapResponse["data"];
      }
    } catch (error) {
      console.error("Error fetching cached price data from Redis:", error);
    }
    // If no cached data, fetch the latest price
    return await PriceService.getPrice();
  }
  static async getPrice() {
    try {
      // Try to fetch latest prices
      const priceData = await PriceService.fetchPrice();

      // Cache the result in Redis
      await redis.set("price_data", JSON.stringify(priceData));

      return priceData;
    } catch (error) {
      // If fetch fails, try to get cached data from Redis
      const cachedData = await redis.get("price_data");

      if (cachedData) {
        return JSON.parse(cachedData) as CoinMarketCapResponse["data"];
      }

      // If no cached data, re-throw the original error
      throw error;
    }
  }
  static async fetchPrice() {
    // Get token prices using CoinMarketCap API instead of CoinGecko
    const priceResponse = await fetch(
      "https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=BTC,ETH,SOL",
      {
        headers: {
          "X-CMC_PRO_API_KEY": process.env.COINMARKETCAP_API_KEY!,
          Accept: "application/json",
        },
      },
    );

    if (!priceResponse.ok) {
      throw new Error(`CoinMarketCap API error: ${priceResponse.status}`);
    }

    const priceData = (await priceResponse.json()) as CoinMarketCapResponse;

    return priceData.data as CoinMarketCapResponse["data"];
  }
}
