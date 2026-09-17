import type { CalcResult } from "./types.js";

export interface CalcInput {
  gramsUsed: number;
  printMinutes: number;
  filamentPricePerKg: number;
  printerPowerWatts: number;
  printerPurchasePrice: number;
  printerLifetimeHours: number;
  energyPriceKwh: number;
  accessoriesCost: number;
  extraPackagingCost: number;
  failureRatePct: number;
  consumerMarkup: number;
  resellerMarkup: number;
  marketplaceFeePct: number;
  cardFeePct: number;
}

/** Margem mínima saudável sobre o custo para o preço de lojista, mesmo com markup de consumidor baixo. */
const MIN_RESELLER_MARKUP = 1.3;

/**
 * Keystone pricing: o mercado varejista tradicionalmente define o preço de atacado como
 * ~metade do preço de varejo, para que o lojista possa dobrar o preço e ainda bater no
 * preço sugerido ao consumidor final.
 */
export function suggestResellerMarkup(consumerMarkup: number): number {
  return Math.max(MIN_RESELLER_MARKUP, consumerMarkup / 2);
}

export function calculatePricing(input: CalcInput): CalcResult {
  const {
    gramsUsed,
    printMinutes,
    filamentPricePerKg,
    printerPowerWatts,
    printerPurchasePrice,
    printerLifetimeHours,
    energyPriceKwh,
    accessoriesCost,
    extraPackagingCost,
    failureRatePct,
    consumerMarkup,
    resellerMarkup,
    marketplaceFeePct,
    cardFeePct,
  } = input;

  const printHours = printMinutes / 60;

  const filamentCost = (gramsUsed / 1000) * filamentPricePerKg;
  const energyCost = printHours * (printerPowerWatts / 1000) * energyPriceKwh;
  const depreciationCost =
    printerLifetimeHours > 0 ? printHours * (printerPurchasePrice / printerLifetimeHours) : 0;
  const packagingCost = accessoriesCost + extraPackagingCost;

  const directCost = filamentCost + energyCost + depreciationCost + packagingCost;
  const costWithFailure = directCost * (1 + failureRatePct / 100);

  const consumerFeePct = marketplaceFeePct + cardFeePct;
  const resellerFeePct = cardFeePct;

  const consumerPriceBeforeFees = costWithFailure * consumerMarkup;
  const consumerFinalPrice =
    consumerFeePct >= 100
      ? consumerPriceBeforeFees
      : consumerPriceBeforeFees / (1 - consumerFeePct / 100);

  const resellerPriceBeforeFees = costWithFailure * resellerMarkup;
  const resellerFinalPrice =
    resellerFeePct >= 100
      ? resellerPriceBeforeFees
      : resellerPriceBeforeFees / (1 - resellerFeePct / 100);

  return {
    filamentCost,
    energyCost,
    depreciationCost,
    packagingCost,
    directCost,
    costWithFailure,
    consumerPriceBeforeFees,
    consumerFinalPrice,
    resellerPriceBeforeFees,
    resellerFinalPrice,
  };
}
