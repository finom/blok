import BalanceService from './BalanceService';
import PriceService from './PriceService';
import ConfigService from './ConfigService';

export default class ExchangeService {
  static async getBalances() {
    try {
      // Get all wallet balances first using BalanceService
      const ethBalance = await BalanceService.getEthBalance(
        ConfigService.wallets.ETH,
      );
      const btcBalance = await BalanceService.getBtcBalance(
        ConfigService.wallets.BTC,
      );
      const solBalance = await BalanceService.getSolBalance(
        ConfigService.wallets.SOL,
      );

      const priceData = await PriceService.getPrice();

      const results = {
        eth: {
          ...ethBalance,
          price: priceData.ETH?.quote.USD.price || 0,
        },
        btc: {
          ...btcBalance,
          price: priceData.BTC?.quote.USD.price || 0,
        },
        sol: {
          ...solBalance,
          price: priceData.SOL?.quote.USD.price || 0,
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