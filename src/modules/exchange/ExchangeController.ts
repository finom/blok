import { prefix, get, openapi } from "vovk";
import { withZod } from "vovk-zod";

import ExchangeService from "./ExchangeService";

@prefix("exchanges")
export default class ExchangeController {
  @openapi({
    summary: "Get Exchanges",
  })
  @get("", { cors: true })
  static getTokenPrices = withZod({
    handle: () => {
      return ExchangeService.getTokenPrices();
    },
  });
}
