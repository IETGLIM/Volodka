/* ─── Volodka RPG – Trading Data ───
 * Merchant inventories, pricing, and relationship discount system.
 * Currency: «кредиты» (credits) — the underground digital currency of the city.
 */

import type { ItemRarity } from '@/data/items';

/* ─── Currency constants ─── */
export const CURRENCY_SYMBOL = '₴';

/* ─── Merchant item entry ─── */
export interface MerchantItem {
  itemId: string;
  basePrice: number; // base price in credits
  stock?: number; // -1 = infinite, otherwise max quantity available
  /** Minimum relationship value (0-100) required to access this item */
  minRelation?: number;
}

/* ─── Buy-back entry: what the NPC will buy from the player ─── */
export interface BuybackEntry {
  itemId: string;
  /** Percentage of the item's base price that the NPC pays (0.3 = 30%) */
  buyPricePercent: number;
  /** If true, NPC only buys this when relationship >= minRelation */
  minRelation?: number;
}

/* ─── Merchant inventory ─── */
export interface MerchantInventory {
  npcId: string;
  npcName: string;
  greeting: string;
  /** Items the NPC sells */
  sells: MerchantItem[];
  /** Items the NPC buys from the player */
  buys: BuybackEntry[];
  /** Base relationship discount: at relation 100, discount is this % */
  maxRelationDiscount: number; // e.g. 0.25 = 25% off at max relation
}

/* ─── All merchant inventories ─── */

export const MERCHANT_INVENTORIES: MerchantInventory[] = [
  /* ─── Бариста (Cafe Barista) ─── */
  {
    npcId: 'cafe_barista',
    npcName: 'Бариста',
    greeting: 'Что будешь? Сегодня свежая партия.',
    maxRelationDiscount: 0.20,
    sells: [
      { itemId: 'coffee', basePrice: 5, stock: -1 },
      { itemId: 'espresso_shot', basePrice: 8, stock: -1 },
      { itemId: 'barista_special_coffee', basePrice: 18, stock: 3 },
      { itemId: 'energy_drink', basePrice: 12, stock: -1 },
      { itemId: 'cafe_rumor_note', basePrice: 15, stock: 2, minRelation: 30 },
    ],
    buys: [
      { itemId: 'poem_fragment', buyPricePercent: 0.4 },
      { itemId: 'old_poetry_book', buyPricePercent: 0.5, minRelation: 20 },
      { itemId: 'scraps', buyPricePercent: 0.2 },
    ],
  },

  /* ─── Зарема (Zarema) ─── */
  {
    npcId: 'zarema',
    npcName: 'Зарема',
    greeting: 'Я как раз готовила! Может, тебе что-то нужно?',
    maxRelationDiscount: 0.25,
    sells: [
      { itemId: 'tea', basePrice: 4, stock: -1 },
      { itemId: 'zarema_herbal_tea', basePrice: 14, stock: 3 },
      { itemId: 'home_cooked_meal', basePrice: 20, stock: 2 },
      { itemId: 'healing_salve', basePrice: 16, stock: 3, minRelation: 20 },
      { itemId: 'herbal_tea', basePrice: 10, stock: -1 },
      { itemId: 'nano_patch', basePrice: 22, stock: 2, minRelation: 40 },
    ],
    buys: [
      { itemId: 'copper_wire', buyPricePercent: 0.3 },
      { itemId: 'circuit_board', buyPricePercent: 0.35 },
      { itemId: 'coffee_extract', buyPricePercent: 0.4 },
      { itemId: 'candy', buyPricePercent: 0.5 },
    ],
  },

  /* ─── Альберт (Albert) ─── */
  {
    npcId: 'albert',
    npcName: 'Альберт',
    greeting: 'А, Володька. Ищешь что-то почитать? Или обсудить бытие?',
    maxRelationDiscount: 0.15,
    sells: [
      { itemId: 'book_poetry_modern', basePrice: 25, stock: 1 },
      { itemId: 'book_coding_guide', basePrice: 28, stock: 1 },
      { itemId: 'albert_philosophy_book', basePrice: 45, stock: 1, minRelation: 40 },
      { itemId: 'albert_poetry_collection', basePrice: 35, stock: 1, minRelation: 25 },
      { itemId: 'coding_manual', basePrice: 30, stock: 1 },
    ],
    buys: [
      { itemId: 'old_poetry_book', buyPricePercent: 0.6, minRelation: 20 },
      { itemId: 'poem_fragment', buyPricePercent: 0.5 },
      { itemId: 'encrypted_scroll', buyPricePercent: 0.7, minRelation: 50 },
      { itemId: 'digital_ghost_trace', buyPricePercent: 0.8, minRelation: 60 },
    ],
  },

  /* ─── Коллега (Office Colleague) ─── */
  {
    npcId: 'office_colleague',
    npcName: 'Коллега',
    greeting: '*шёпотом* У меня есть кое-что… Нужны запчасти?',
    maxRelationDiscount: 0.20,
    sells: [
      { itemId: 'circuit_board', basePrice: 8, stock: 5 },
      { itemId: 'copper_wire', basePrice: 5, stock: 5 },
      { itemId: 'data_chip', basePrice: 10, stock: 3 },
      { itemId: 'tech_component', basePrice: 12, stock: 4 },
      { itemId: 'colleague_software_tool', basePrice: 35, stock: 1, minRelation: 30 },
      { itemId: 'usb_drive', basePrice: 6, stock: 3 },
      { itemId: 'wire_tap_kit', basePrice: 40, stock: 1, minRelation: 45 },
    ],
    buys: [
      { itemId: 'code_fragment', buyPricePercent: 0.45 },
      { itemId: 'server_fragment', buyPricePercent: 0.35 },
      { itemId: 'firewall_code', buyPricePercent: 0.5, minRelation: 25 },
      { itemId: 'living_code_fragment', buyPricePercent: 0.6, minRelation: 40 },
    ],
  },

  /* ─── Виктория / Maria ─── */
  {
    npcId: 'maria',
    npcName: 'Виктория',
    greeting: 'Ищешь что-то… особенное? У меня есть вещи, которых нет у других.',
    maxRelationDiscount: 0.25,
    sells: [
      { itemId: 'maria_network_scanner', basePrice: 60, stock: 1, minRelation: 50 },
      { itemId: 'maria_decryption_key', basePrice: 55, stock: 1, minRelation: 45 },
      { itemId: 'encrypted_data_module', basePrice: 30, stock: 2, minRelation: 35 },
      { itemId: 'digital_talisman', basePrice: 25, stock: 2, minRelation: 30 },
      { itemId: 'shadow_cloak', basePrice: 75, stock: 1, minRelation: 65 },
    ],
    buys: [
      { itemId: 'data_chip', buyPricePercent: 0.5, minRelation: 25 },
      { itemId: 'encrypted_usb', buyPricePercent: 0.6, minRelation: 40 },
      { itemId: 'maria_data_chip', buyPricePercent: 0.0 }, // quest item — won't buy
      { itemId: 'cipher_of_freedom', buyPricePercent: 0.0 }, // quest item — won't buy
    ],
  },
];

/* ─── Торговое отношение: личное + репутация фракции (v4.8.8) ───
 * Единая формула для ОТОБРАЖЕНИЯ (TradingPanel) и ТРАНЗАКЦИЙ
 * (playerEconomySlice через readNpcTradeRelationValue). Раньше панель
 * показывала цену по смеси «80% личное + 20% фракция», а слайс списывал
 * кредиты по чисто личному отношению — игрок платил не ту сумму, которую
 * видел на кнопке. Теперь обе стороны считают отношение одним хелпером. */

/** Вес средней репутации фракции в торговом отношении (0..1). */
export const TRADE_FACTION_WEIGHT = 0.2;

/** Нейтральная база личного отношения (совпадает с worldSlice). */
const TRADE_RELATION_NEUTRAL = 50;

/**
 * Смешивает личное отношение NPC с репутацией его фракции.
 * `factionAvg === null` — фракции нет или незнакомых членов (торгуем по
 * личному отношению). Результат зажат в 0..100 и округлён.
 */
export function resolveTradeRelationValue(
  personalRelation: number,
  factionAvg: number | null,
): number {
  const personal = Number.isFinite(personalRelation)
    ? personalRelation
    : TRADE_RELATION_NEUTRAL;
  const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v)));
  if (factionAvg === null || !Number.isFinite(factionAvg)) {
    return clamp(personal);
  }
  const blended =
    personal * (1 - TRADE_FACTION_WEIGHT) + factionAvg * TRADE_FACTION_WEIGHT;
  return clamp(blended);
}

/* ─── Lookup helpers ─── */

const MERCHANT_MAP = new Map<string, MerchantInventory>(
  MERCHANT_INVENTORIES.map((m) => [m.npcId, m]),
);

/**
 * Get a merchant's inventory by NPC ID.
 * Returns undefined if the NPC is not a merchant.
 */
export function getMerchantInventory(npcId: string): MerchantInventory | undefined {
  return MERCHANT_MAP.get(npcId);
}

/**
 * Calculate the buy price for an item from a specific merchant,
 * accounting for the player's relationship with that NPC.
 * Better relationship → lower price (up to maxRelationDiscount).
 */
export function getBuyPrice(
  merchant: MerchantInventory,
  itemId: string,
  relationValue: number,
): number {
  const item = merchant.sells.find((s) => s.itemId === itemId);
  if (!item) return Infinity;

  // Discount: 0% at relation 0, maxRelationDiscount% at relation 100
  const discountPercent = (relationValue / 100) * merchant.maxRelationDiscount;
  const price = Math.round(item.basePrice * (1 - discountPercent));
  return Math.max(1, price); // minimum 1 credit
}

/**
 * Calculate the sell price for an item to a specific merchant,
 * accounting for the player's relationship with that NPC.
 * Better relationship → slightly better sell price.
 */
export function getSellPrice(
  merchant: MerchantInventory,
  itemId: string,
  itemBasePrice: number,
  relationValue: number,
): number {
  const buyEntry = merchant.buys.find((b) => b.itemId === itemId);
  if (!buyEntry || buyEntry.buyPricePercent <= 0) return 0;

  // Small relation bonus: up to +10% sell price at max relation
  const relationBonus = (relationValue / 100) * 0.10;
  const price = Math.round(itemBasePrice * (buyEntry.buyPricePercent + relationBonus));
  return Math.max(1, price);
}

/**
 * Check if a merchant buys a specific item from the player.
 * Also checks the minimum relation requirement.
 */
export function merchantBuysItem(npcId: string, itemId: string, relationValue: number): boolean {
  const merchant = MERCHANT_MAP.get(npcId);
  if (!merchant) return false;
  const entry = merchant.buys.find((b) => b.itemId === itemId);
  if (!entry || entry.buyPricePercent <= 0) return false;
  if (entry.minRelation && relationValue < entry.minRelation) return false;
  return true;
}

/**
 * Check if a specific sell item is accessible (relation-gated).
 */
export function isSellItemAccessible(
  merchant: MerchantInventory,
  itemId: string,
  relationValue: number,
): boolean {
  const item = merchant.sells.find((s) => s.itemId === itemId);
  if (!item) return false;
  if (item.minRelation && relationValue < item.minRelation) return false;
  return true;
}

/**
 * Get a rough base price for an item by its rarity.
 * Used as fallback for items not found in any merchant's sell list.
 */
export function getBasePriceByRarity(rarity: ItemRarity): number {
  switch (rarity) {
    case 'common': return 5;
    case 'uncommon': return 15;
    case 'rare': return 35;
    case 'legendary': return 80;
  }
}
