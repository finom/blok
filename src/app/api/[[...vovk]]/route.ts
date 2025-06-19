import { initVovk } from "vovk";
import ExchangeController from "../../../modules/exchange/ExchangeController";

export const runtime = "edge";

const controllers = {
  ExchangeRPC: ExchangeController,
};

export type Controllers = typeof controllers;

export const { GET, POST, PATCH, PUT, HEAD, OPTIONS, DELETE } = initVovk({
  emitSchema: true,
  controllers,
});
