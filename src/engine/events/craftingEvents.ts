/** Crafting discovery toasts — playerEconomySlice. */
export interface CraftingEvents {
  'crafting:discovered': { recipeId: string; recipeName: string; rarity: import('@/data/items').ItemRarity };
  'item:crafted': { recipeId: string; recipeName: string; category: string };
}
