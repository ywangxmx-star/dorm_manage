export function formatAmount(amount: number): string {
  return `¥${Number(amount).toFixed(2)}`
}

