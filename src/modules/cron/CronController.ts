import cronGuard from "@/decorators/cronGuard";
import { get, prefix } from "vovk";
import PriceService from "../exchange/PriceService";
import BalanceService from "../exchange/BalanceService";

@prefix('/cron')
export default class CronController {
    @get('fetch')
    @cronGuard()
    async fetchBalancesAndPrices() {
      PriceService.getPrice();
      BalanceService.getBalances();
    }
}