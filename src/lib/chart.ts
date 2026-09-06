// Geometry for the Resumen "Acumulado del mes" SVG chart, ported from the accumulation math in
// init-instructions/design/Expensia App.dc.html (renderVals(), lines ~1009-1036). Daily amounts
// accumulate as scaled BigInts (see lib/decimal.ts); only the final pixel positions convert to
// Number, which is safe because that's purely visual geometry, never a persisted or summed total.

import { parseScaled } from '@/lib/decimal';
import { monthAbbrev } from '@/lib/format';
import { dayOfMonth, monthDays, todayIso } from '@/lib/month';
import type { ExpenseResponse } from '@/types/api';

const WIDTH = 600;
const HEIGHT = 168;
const TOP = 8;
const BOTTOM = 22;

export interface AccumulatedChart {
  areaPath: string;
  linePath: string;
  idealPath: string;
  projectionPath: string;
  dotX: number;
  dotY: number;
  todayX: number;
  baseY: number;
  labels: string[];
  paceHigh: boolean;
}

/** Per-day amounts (index 1..monthDays) in one currency, scaled to a BigInt. Index 0 is unused. */
export function computeDailyScaled(
  expenses: ExpenseResponse[],
  month: string,
  currencyCode: string,
  scale: number
): bigint[] {
  const days = monthDays(month);
  const dailyScaled = new Array<bigint>(days + 1).fill(0n);

  expenses.forEach((expense) => {
    if (expense.currencyCode !== currencyCode) {
      return;
    }
    const day = Number(expense.expenseDate.slice(8, 10));
    dailyScaled[day] = (dailyScaled[day] ?? 0n) + parseScaled(expense.amount, scale);
  });

  return dailyScaled;
}

export function computeAccumulatedChart(
  expenses: ExpenseResponse[],
  month: string,
  budgetCurrencyCode: string,
  budgetScale: number,
  totalBudget: string
): AccumulatedChart {
  const days = monthDays(month);
  const today = dayOfMonth(todayIso());
  const totalScaled = parseScaled(totalBudget, budgetScale);
  const dailyScaled = computeDailyScaled(expenses, month, budgetCurrencyCode, budgetScale);

  const points: Array<[number, bigint]> = [];
  let cumulative = 0n;

  for (let day = 1; day <= today; day++) {
    cumulative += dailyScaled[day] ?? 0n;
    points.push([day, cumulative]);
  }

  const spentScaled = cumulative;
  const maxValue = Math.max(Number(totalScaled), Number(spentScaled), 1) * 1.06;

  const x = (day: number) => ((day - 1) / Math.max(days - 1, 1)) * WIDTH;
  const yValue = (value: number) => HEIGHT - BOTTOM - (value / maxValue) * (HEIGHT - TOP - BOTTOM);
  const yScaled = (value: bigint) => yValue(Number(value));

  const pixels = points.map(([day, cum]) => [x(day), yScaled(cum)] as [number, number]);
  const linePath = pixels
    .map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`)
    .join(' ');
  const last = pixels[pixels.length - 1] ?? [0, yValue(0)];
  const baseY = HEIGHT - BOTTOM;

  const areaPath = `${linePath} L${last[0].toFixed(1)} ${baseY} L0 ${baseY} Z`;
  const idealPath = `M0 ${yValue(0).toFixed(1)} L${WIDTH} ${yScaled(totalScaled).toFixed(1)}`;

  const projectedTotal = today > 0 ? (Number(spentScaled) / today) * days : 0;
  const projectionPath = `M${last[0].toFixed(1)} ${last[1].toFixed(1)} L${WIDTH} ${yValue(
    Math.min(projectedTotal, maxValue)
  ).toFixed(1)}`;

  const paceHigh = today > 0 && Number(spentScaled) / today > Number(totalScaled) / days;

  const monthLabel = monthAbbrev(`${month}-01`);
  const labelDays = [1, Math.round(days * 0.33), Math.round(days * 0.67), days];

  return {
    areaPath,
    linePath,
    idealPath,
    projectionPath,
    dotX: last[0],
    dotY: last[1],
    todayX: last[0],
    baseY,
    labels: labelDays.map((day) => `${day} ${monthLabel}`),
    paceHigh,
  };
}
