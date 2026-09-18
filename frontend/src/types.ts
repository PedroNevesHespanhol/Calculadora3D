export interface Printer {
  id: string;
  name: string;
  powerWatts: number;
  purchasePrice: number;
  lifetimeHours: number;
}

export interface Filament {
  id: string;
  name: string;
  pricePerKg: number;
}

export interface Accessory {
  id: string;
  name: string;
  cost: number;
}

export interface Settings {
  energyPriceKwh: number;
  defaultFailureRatePct: number;
  defaultConsumerMarkup: number;
  defaultResellerMarkup: number;
  marketplaceFeePct: number;
  cardFeePct: number;
}

export interface CalcResult {
  /** Quantidade de peças entre as quais o custo do lote foi rateado. */
  quantity: number;
  filamentCost: number;
  energyCost: number;
  depreciationCost: number;
  packagingCost: number;
  directCost: number;
  costWithFailure: number;
  consumerPriceBeforeFees: number;
  consumerFinalPrice: number;
  resellerPriceBeforeFees: number;
  resellerFinalPrice: number;
  /** Lucro líquido por peça ao vender direto ao consumidor final. */
  myProfitConsumerSale: number;
  /** Lucro líquido por peça ao vender para um lojista. */
  myProfitResellerSale: number;
  /** Lucro líquido por peça que o lojista pode obter revendendo ao consumidor final. */
  resellerProfit: number;
}

export interface PieceInput {
  printerId: string;
  filamentId: string;
  gramsUsed: number;
  printMinutes: number;
  quantity: number;
  failureRatePct: number;
  consumerMarkup: number;
  resellerMarkup: number;
  marketplaceFeePct: number;
  cardFeePct: number;
  extraPackagingCost: number;
  accessoryIds: string[];
}

export interface Piece extends PieceInput {
  id: string;
  name: string;
  result: CalcResult;
  createdAt: string;
}

export type PriceType = "consumidor" | "lojista";

export interface QuoteItem {
  id: string;
  pieceId: string | null;
  name: string;
  quantity: number;
  unitPrice: number;
  priceType: PriceType;
}

export interface QuoteDraft {
  clientName: string;
  notes: string;
  items: QuoteItem[];
}
