import { prefix, get, openapi } from "vovk";
import { withZod } from "vovk-zod";

import ExchangeService from "./ExchangeService";

@prefix("balance")
export default class ExchangeController {
  @openapi({
    summary: "Get Balance",
  })
  @get("", { cors: true })
  static getBalances = withZod({
    handle: () => ExchangeService.getBalances(),
  });

  @openapi({
    summary: "Get Token Balance",
  })
  @get("total", { cors: true })
  static getTokenBalance = withZod({
    handle: async () => {
      const { totalBalance } = await ExchangeService.getBalances();
      return totalBalance;
    }
  });
}
