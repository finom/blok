import { prefix, get, openapi } from "vovk";
import { withZod } from "vovk-zod";

import ExchangeService from "./ExchangeService";
import { z } from "zod/v4";

@prefix("exchanges")
export default class ExchangeController {
  @openapi({
    summary: "Get Exchanges",
  })
  @get('', { cors: true })
  static getExchangeValue = withZod({
    handle: () => {
      return ExchangeService.getAllValues();
    }
  });

  @get('/:currency', { cors: true })
  static getExchangeValueByCurrency = withZod({
    params: z.object({
      currency: z.enum(['BTC', 'ETH', 'SOL']),
    }),
    handle: ({ vovk }) => {
      const params = vovk.params();
      return ExchangeService.getValue(params.currency);
    }
  });
}
