import { initVovk } from "vovk";
import * as Sentry from '@sentry/node';
import ExchangeController from "../../../modules/exchange/ExchangeController";
import CronController from "@/modules/cron/CronController";

export const runtime = "nodejs";

const controllers = {
  ExchangeRPC: ExchangeController,
  _CronRPC: CronController,
};

export type Controllers = typeof controllers;

Sentry.init({
  dsn: 'https://47fe8320c2e89c70dfce159d4316cc83@o4508756583841792.ingest.de.sentry.io/4509571679780944',
  // ...
});

export const { GET, POST, PATCH, PUT, HEAD, OPTIONS, DELETE } = initVovk({
  emitSchema: true,
  controllers,
  onError: (error, req) => {
    if (!req.url.includes('localhost')) {
      Sentry.captureException(error, {
        extra: {
          url: req.url,
          method: req.method,
        },
      });
    }
    console.error("Vovk Error:", error);
  },
});
