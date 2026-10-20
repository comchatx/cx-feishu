// Preloaded into the witness's pi. pi-channels refuses a webhook whose host resolves to a loopback address, so the route names
// STUB_HOST: it resolves to a public address, which passes that check, and its requests are carried to the stub on 127.0.0.1.
import dns from "node:dns/promises";
import http from "node:http";
import https from "node:https";
import { syncBuiltinESMExports } from "node:module";

const host = process.env.STUB_HOST;
const port = Number(process.env.STUB_PORT);
const lookup = dns.lookup;
dns.lookup = function (hostname, options) {
  if (hostname !== host) return lookup.apply(this, arguments);
  const address = { address: "93.184.216.34", family: 4 };
  return Promise.resolve(typeof options === "object" && options?.all ? [address] : address);
};
const request = https.request;
https.request = function (url, options, callback) {
  const target = new URL(String(url));
  if (target.hostname !== host) return request.apply(this, arguments);
  const { method, headers, signal } = typeof options === "object" ? options : {};
  return http.request({ host: "127.0.0.1", port, path: `${target.pathname}${target.search}`, method, headers, signal }, typeof options === "function" ? options : callback);
};
syncBuiltinESMExports();
