import BigNumber from "bignumber.js";
import { USDC_DECIMALS } from "./config";

export function formatUsdc(raw: bigint | number | string): string {
  const v = new BigNumber(raw.toString()).shiftedBy(-USDC_DECIMALS);
  if (v.isZero()) return "$0.00";
  return `$${v.toFormat(2)}`;
}

export function parseUsdc(input: string): bigint {
  const v = new BigNumber(input);
  if (!v.isFinite() || v.isNegative()) throw new Error("invalid USDC amount");
  return BigInt(v.shiftedBy(USDC_DECIMALS).integerValue(BigNumber.ROUND_FLOOR).toFixed(0));
}

export function formatBps(bps: number): string {
  if (bps === 0) return "—";
  return `${(bps / 100).toFixed(bps % 100 === 0 ? 0 : 2)}%`;
}

export function shortAddress(addr: string | undefined | null, chars = 4) {
  if (!addr) return "—";
  return `${addr.slice(0, chars)}…${addr.slice(-chars)}`;
}
