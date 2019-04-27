export function isPositiveInteger(num: number) {
  return Number.isSafeInteger(num) && num > 0;
}
