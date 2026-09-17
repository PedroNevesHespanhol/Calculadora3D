import { suggestResellerMarkup } from "./calc.js";
import type { Accessory, Filament, Piece, Printer, QuoteDraft, Settings } from "./types.js";

const KEYS = {
  printers: "calc3d.printers",
  filaments: "calc3d.filaments",
  accessories: "calc3d.accessories",
  settings: "calc3d.settings",
  pieces: "calc3d.pieces",
  quoteDraft: "calc3d.quoteDraft",
} as const;

const DEFAULT_CONSUMER_MARKUP = 3;

const DEFAULT_SETTINGS: Settings = {
  energyPriceKwh: 0.95,
  defaultFailureRatePct: 5,
  defaultConsumerMarkup: DEFAULT_CONSUMER_MARKUP,
  defaultResellerMarkup: suggestResellerMarkup(DEFAULT_CONSUMER_MARKUP),
  marketplaceFeePct: 0,
  cardFeePct: 0,
};

const DEFAULT_QUOTE_DRAFT: QuoteDraft = {
  clientName: "",
  notes: "",
  items: [],
};

function loadList<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveList<T>(key: string, items: T[]): void {
  localStorage.setItem(key, JSON.stringify(items));
}

function makeId(): string {
  return crypto.randomUUID();
}

function createCrud<T extends { id: string }>(key: string) {
  return {
    list(): T[] {
      return loadList<T>(key);
    },
    add(item: Omit<T, "id">): T {
      const items = loadList<T>(key);
      const newItem = { ...item, id: makeId() } as T;
      saveList(key, [...items, newItem]);
      return newItem;
    },
    update(id: string, item: Omit<T, "id">): T | null {
      const items = loadList<T>(key);
      const index = items.findIndex((i) => i.id === id);
      if (index === -1) return null;
      const updated = { ...item, id } as T;
      items[index] = updated;
      saveList(key, items);
      return updated;
    },
    remove(id: string): void {
      const items = loadList<T>(key).filter((i) => i.id !== id);
      saveList(key, items);
    },
  };
}

export const printersStore = createCrud<Printer>(KEYS.printers);
export const filamentsStore = createCrud<Filament>(KEYS.filaments);
export const accessoriesStore = createCrud<Accessory>(KEYS.accessories);
export const piecesStore = createCrud<Piece>(KEYS.pieces);

export const settingsStore = {
  get(): Settings {
    try {
      const raw = localStorage.getItem(KEYS.settings);
      if (!raw) return DEFAULT_SETTINGS;
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch {
      return DEFAULT_SETTINGS;
    }
  },
  save(settings: Settings): void {
    localStorage.setItem(KEYS.settings, JSON.stringify(settings));
  },
};

export const quoteDraftStore = {
  get(): QuoteDraft {
    try {
      const raw = localStorage.getItem(KEYS.quoteDraft);
      if (!raw) return DEFAULT_QUOTE_DRAFT;
      return { ...DEFAULT_QUOTE_DRAFT, ...JSON.parse(raw) };
    } catch {
      return DEFAULT_QUOTE_DRAFT;
    }
  },
  save(draft: QuoteDraft): void {
    localStorage.setItem(KEYS.quoteDraft, JSON.stringify(draft));
  },
  clear(): void {
    localStorage.removeItem(KEYS.quoteDraft);
  },
};
