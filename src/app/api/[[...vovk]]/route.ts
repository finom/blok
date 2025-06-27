import { initVovk } from "vovk";
import ExchangeController from "../../../modules/exchange/ExchangeController";
import CronController from "@/modules/cron/CronController";

export const runtime = "nodejs";

const controllers = {
  ExchangeRPC: ExchangeController,
  _CronRPC: CronController,
};

export type Controllers = typeof controllers;

export const { GET, POST, PATCH, PUT, HEAD, OPTIONS, DELETE } = initVovk({
  emitSchema: true,
  controllers,
  onError: (error) => {
    console.error("Vovk Error:", error);
  },
});
