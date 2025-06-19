import { getExchangeRates, getExchangeValue, getWalletBalance } from "@/lib/getExchangeValue";

export default class ExchangeService {
  static wallets = {
    BTC: '34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo',
      ETH: '0x2bf916f8169Ed2a77324d3E168284FC252aE4087',
      SOL: '8BxX8691h5pffmdhfRTLaQeiHJkdgQiyKvNrrEdM8ri6'
  };

  static getAllValues = () => {
    return getExchangeValue(ExchangeService.wallets);
  };

  static getValue(currency: 'BTC' | 'ETH' | 'SOL') {
    const walletAddress = ExchangeService.wallets[currency];
    if (!walletAddress) {
      throw new Error(`No wallet address found for currency: ${currency}`);
    }
    return ExchangeService.getOneValue(currency, walletAddress);
  }

  static getOneValue = async (currency: 'BTC' | 'ETH' | 'SOL', walletAddress: string) => {
     try {

      const balance = await getWalletBalance(currency, walletAddress);

      const exchanges = await getExchangeRates(currency);
      
      if (exchanges.length === 0) {
        throw new Error(`No exchange rates found for ${currency}`);
      }

      const averageRate = exchanges.reduce((sum, exchange) => sum + exchange.exchangeRate, 0) / exchanges.length;
      const calculatedValue = balance * averageRate;
      

      return {
        wallet: walletAddress,
        balance,
        exchanges,
        calculatedValue
      };
    } catch (error) {
      console.error(`Failed to process ${currency} wallet ${walletAddress}:`, error);
      return  {
        wallet: walletAddress,
        balance: 0,
        exchanges: [],
        calculatedValue: 0,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
}
