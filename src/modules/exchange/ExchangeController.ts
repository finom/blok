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
    handle: () => ExchangeService.getCachedBalances(),
  });

  @openapi({
    summary: "Get Token Balance",
  })
  @get("total", { cors: true })
  static getTokenBalance = withZod({
    handle: async () => {
      const { totalBalance } = await ExchangeService.getCachedBalances();
      return typeof totalBalance === "number" ? Math.round(totalBalance) : null;
    },
  });
}
