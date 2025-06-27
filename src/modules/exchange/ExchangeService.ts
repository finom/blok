import BalanceService from "./BalanceService";
import PriceService from "./PriceService";

export default class ExchangeService {
  static async getCachedBalances() {
    try {
      // Get all wallet balances first using BalanceService
      const balances = await BalanceService.getCachedAllBalances();

      const priceData = await PriceService.getCachedPrice();

      const results = {
        ETH: {
          ...balances.ETH,
          price: priceData.ETH?.quote.USD.price || 0,
        },
        BTC: {
          ...balances.BTC,
          price: priceData.BTC?.quote.USD.price || 0,
        },
        SOL: {
          ...balances.SOL,
          price: priceData.SOL?.quote.USD.price || 0,
        },
        ADA: {
          ...balances.ADA,
          price: priceData.ADA?.quote.USD.price || 0,
        },
        AVAX: {
          ...balances.AVAX,
          price: priceData.AVAX?.quote.USD.price || 0,
        },
      };

      const totalBalance = Object.values(results).reduce(
        (acc, token) => acc + token.balance * token.price,
        0,
      );

      return {
        results,
        totalBalance,
      };
    } catch (error) {
      console.error("Error fetching wallet balances or prices:", error);
      return {
        error: "Failed to get any wallet balances",
      };
    }
  }
}
