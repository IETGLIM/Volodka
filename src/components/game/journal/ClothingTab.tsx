/* ─── Volodka RPG – Clothing Tab (Journal) ───
 * Disco Elysium-style outfit view: shows equipped clothing across
 * 6 slots, social perception tags, and skill/dialogue modifiers.
 */

import { useMemo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePlayerState, useEquippedItems } from '@/store/selectors';
import {
  useSocialPerceptionTags,
  useClothingSkillModifiers,
  useClothingDialogueModifier,
  getClothingDefinitionForEquipped,
} from '@/store/selectors/clothingSelectors';
import { CLOTHING_CATALOG } from '@/data/clothingCatalog';
import type { ClothingDefinition, SocialPerceptionTag } from '@/data/clothingCatalog';
import type { EquipmentSlot } from '@/shared/types/game';
import {
  INVENTORY_SLOT_LABELS,
  INVENTORY_SLOT_ICONS,
  INVENTORY_RARITY_TEXT_CLASS,
  INVENTORY_RARITY_BORDER_CLASS,
} from '@/components/game/inventory/inventoryConstants';
import type { ItemRarity } from '@/data/items';
import { getRarityLabel } from '@/data/items';
import { JOURNAL_SKILL_LABELS } from '@/components/game/journal/journalConstants';
import type { TrainablePlayerSkill } from '@/shared/types/definitions/skills';
import { Shield, Tag, Swords, MessageCircle, Lock, Unlock } from 'lucide-react';

interface ClothingTabProps {
  searchQuery: string;
}

const ALL_EQUIPMENT_SLOTS: EquipmentSlot[] = ['head', 'body', 'legs', 'feet', 'hands', 'accessory'];

/* ─── Social perception tag visual config ─── */

const TAG_COLORS: Record<SocialPerceptionTag, { bg: string; text: string; border: string }> = {
  official: { bg: 'bg-slate-800/60', text: 'text-slate-300', border: 'border-slate-600/40' },
  shabby: { bg: 'bg-amber-950/50', text: 'text-amber-300', border: 'border-amber-700/30' },
  cyberpunk_chic: { bg: 'bg-cyan-950/50', text: 'text-cyan-300', border: 'border-cyan-700/30' },
  casual: { bg: 'bg-emerald-950/50', text: 'text-emerald-300', border: 'border-emerald-700/30' },
  worker: { bg: 'bg-orange-950/50', text: 'text-orange-300', border: 'border-orange-700/30' },
  suspicious: { bg: 'bg-red-950/50', text: 'text-red-300', border: 'border-red-700/30' },
};

const TAG_LABELS: Record<SocialPerceptionTag, string> = {
  official: 'Официальный',
  shabby: 'Оборванный',
  cyberpunk_chic: 'Кибер-шик',
  casual: 'Повседневный',
  worker: 'Рабочий',
  suspicious: 'Подозрительный',
};

export function ClothingTab({ searchQuery }: ClothingTabProps) {
  const playerState = usePlayerState();
  const equippedItems = useEquippedItems();
  const socialTags = useSocialPerceptionTags();
  const skillModifiers = useClothingSkillModifiers();
  const dialogueModifier = useClothingDialogueModifier();

  const clothingById = useMemo(() => {
    const map = new Map<string, ClothingDefinition>();
    for (const c of CLOTHING_CATALOG) {
      map.set(c.id, c);
    }
    return map;
  }, []);

  /* Build slot data: for each slot, show equipped item + clothing definition */
  const slotData = useMemo(() => {
    return ALL_EQUIPMENT_SLOTS.map((slot) => {
      const item = equippedItems[slot];
      const clothing = item ? getClothingDefinitionForEquipped(item) : undefined;
      return { slot, item, clothing };
    });
  }, [equippedItems]);

  /* Filter clothing catalog for search */
  const filteredCatalog = useMemo(() => {
    if (!searchQuery.trim()) return CLOTHING_CATALOG;
    const query = searchQuery.toLowerCase();
    return CLOTHING_CATALOG.filter(
      (c) => c.name.toLowerCase().includes(query) || c.description.toLowerCase().includes(query),
    );
  }, [searchQuery]);

  /* Active skill modifier entries (non-zero) */
  const activeSkillMods = useMemo(() => {
    return (Object.entries(skillModifiers) as [TrainablePlayerSkill, number][]).filter(
      ([, value]) => value !== 0 && value !== undefined,
    );
  }, [skillModifiers]);

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-5">
        {/* ── Equipment Slots ── */}
        <div>
          <h3 className="text-xs font-medium text-slate-400 mb-3 flex items-center gap-1.5 font-mono uppercase tracking-wider">
            <Shield className="size-3.5 text-cyan-400" aria-hidden />
            Экипировка
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {slotData.map(({ slot, item, clothing }) => {
              const label = INVENTORY_SLOT_LABELS[slot] ?? slot;
              const icon = INVENTORY_SLOT_ICONS[slot] ?? '?';
              const rarity: ItemRarity = clothing?.rarity ?? 'common';
              const rarityTextClass = INVENTORY_RARITY_TEXT_CLASS[rarity];
              const rarityBorderClass = INVENTORY_RARITY_BORDER_CLASS[rarity];

              return (
                <div
                  key={slot}
                  className={`rounded-lg border p-2.5 transition-all duration-200 ${
                    item
                      ? `${rarityBorderClass} bg-slate-900/50`
                      : 'border-slate-700/20 bg-slate-900/20'
                  }`}
                >
                  <div className="text-[10px] text-slate-500 mb-1.5 flex items-center gap-1">
                    {item && (
                      <span className="text-[8px] px-1 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono leading-none">
                        НАДЕТО
                      </span>
                    )}
                    <span>{label}</span>
                    {!item && <span className="opacity-40 ml-0.5">{icon}</span>}
                  </div>
                  {item && clothing ? (
                    <div className="space-y-1">
                      <p className={`text-xs font-medium truncate ${rarityTextClass}`}>
                        {item.name}
                      </p>
                      <p className="text-[10px] text-slate-600 truncate">
                        {getRarityLabel(rarity)}
                      </p>
                      {/* Show effects */}
                      {clothing.effects.length > 0 && (
                        <div className="flex flex-wrap gap-0.5">
                          {clothing.effects.map((effect, i) => (
                            <span
                              key={i}
                              className="text-[8px] px-1 py-0.5 rounded bg-slate-800/40 text-cyan-400 border border-cyan-900/20"
                            >
                              {effect.skill
                                ? `${JOURNAL_SKILL_LABELS[effect.skill].name} ${effect.value > 0 ? '+' : ''}${effect.value}`
                                : effect.stat
                                  ? `${effect.stat === 'energy' ? '⚡' : effect.stat === 'stress' ? '😰' : '☯'} ${effect.value > 0 ? '+' : ''}${effect.value}`
                                  : `${effect.value}`}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-600 italic">Пусто</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Social Perception Tags ── */}
        <div>
          <h3 className="text-xs font-medium text-slate-400 mb-3 flex items-center gap-1.5 font-mono uppercase tracking-wider">
            <Tag className="size-3.5 text-cyan-400" aria-hidden />
            Социальное восприятие
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {socialTags.length > 0 ? (
              socialTags.map((tag) => {
                const config = TAG_COLORS[tag];
                return (
                  <span
                    key={tag}
                    className={`text-[10px] px-2 py-1 rounded-md ${config.bg} ${config.text} border ${config.border}`}
                  >
                    {TAG_LABELS[tag]}
                  </span>
                );
              })
            ) : (
              <span className="text-[10px] text-slate-600 italic">Без одежды — без впечатления</span>
            )}
          </div>
        </div>

        {/* ── Skill Modifiers ── */}
        <div>
          <h3 className="text-xs font-medium text-slate-400 mb-3 flex items-center gap-1.5 font-mono uppercase tracking-wider">
            <Swords className="size-3.5 text-cyan-400" aria-hidden />
            Модификаторы навыков
          </h3>
          <div className="space-y-2">
            {activeSkillMods.length > 0 ? (
              activeSkillMods.map(([skill, value]) => {
                const info = JOURNAL_SKILL_LABELS[skill];
                return (
                  <div
                    key={skill}
                    className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-900/30 border border-cyan-900/15"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`size-2 rounded-full bg-gradient-to-r ${info.color}`}
                        aria-hidden
                      />
                      <span className="text-xs text-slate-200">{info.name}</span>
                    </div>
                    <span className={`text-xs font-mono ${value > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {value > 0 ? '+' : ''}{value}
                    </span>
                  </div>
                );
              })
            ) : (
              <p className="text-[10px] text-slate-600 italic px-3">Одежда не влияет на навыки</p>
            )}
          </div>
        </div>

        {/* ── Dialogue Modifier ── */}
        <div>
          <h3 className="text-xs font-medium text-slate-400 mb-3 flex items-center gap-1.5 font-mono uppercase tracking-wider">
            <MessageCircle className="size-3.5 text-cyan-400" aria-hidden />
            Влияние на диалоги
          </h3>

          {dialogueModifier.dcAdjustment !== 0 && (
            <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-900/30 border border-cyan-900/15 mb-2">
              <span className="text-xs text-slate-200">Сложность проверок (DC)</span>
              <span className={`text-xs font-mono ${dialogueModifier.dcAdjustment < 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {dialogueModifier.dcAdjustment > 0 ? '+' : ''}{dialogueModifier.dcAdjustment}
              </span>
            </div>
          )}

          {dialogueModifier.unlockTags.length > 0 && (
            <div className="px-3 py-2 rounded-lg bg-emerald-950/20 border border-emerald-700/20 mb-2">
              <div className="flex items-center gap-1.5 mb-1">
                <Unlock className="size-3 text-emerald-400" aria-hidden />
                <span className="text-[10px] text-emerald-400 uppercase tracking-wider">Открывает</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {dialogueModifier.unlockTags.map((tag) => (
                  <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-900/30 text-emerald-300 border border-emerald-700/20">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {dialogueModifier.lockTags.length > 0 && (
            <div className="px-3 py-2 rounded-lg bg-red-950/20 border border-red-700/20 mb-2">
              <div className="flex items-center gap-1.5 mb-1">
                <Lock className="size-3 text-red-400" aria-hidden />
                <span className="text-[10px] text-red-400 uppercase tracking-wider">Блокирует</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {dialogueModifier.lockTags.map((tag) => (
                  <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-red-900/30 text-red-300 border border-red-700/20">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {dialogueModifier.dcAdjustment === 0
            && dialogueModifier.unlockTags.length === 0
            && dialogueModifier.lockTags.length === 0
            && (
            <p className="text-[10px] text-slate-600 italic px-3">Одежда не влияет на диалоги</p>
          )}
        </div>

        {/* ── Clothing Catalog (browse available items) ── */}
        {filteredCatalog.length > 0 && (
          <div>
            <h3 className="text-xs font-medium text-slate-400 mb-3 flex items-center gap-1.5 font-mono uppercase tracking-wider">
              Каталог одежды ({filteredCatalog.length})
            </h3>
            <div className="space-y-1.5 max-h-96 overflow-y-auto">
              {filteredCatalog.map((clothing) => {
                const isEquipped = ALL_EQUIPMENT_SLOTS.some(
                  (slot) => equippedItems[slot]?.id === clothing.id,
                );
                const rarityBorderClass = INVENTORY_RARITY_BORDER_CLASS[clothing.rarity];
                const rarityTextClass = INVENTORY_RARITY_TEXT_CLASS[clothing.rarity];

                return (
                  <div
                    key={clothing.id}
                    className={`px-3 py-2 rounded-lg ${rarityBorderClass} bg-slate-900/30 ${
                      isEquipped ? 'ring-1 ring-emerald-500/30' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className={`text-xs font-medium ${rarityTextClass}`}>
                        {clothing.name}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-600">
                          {INVENTORY_SLOT_LABELS[clothing.slot]}
                        </span>
                        <span className="text-[10px] text-slate-600">
                          {getRarityLabel(clothing.rarity)}
                        </span>
                        {isEquipped && (
                          <span className="text-[8px] px-1 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono">
                            НАДЕТО
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-600 break-words">{clothing.description}</p>
                    {clothing.socialPerception.length > 0 && (
                      <div className="flex flex-wrap gap-0.5 mt-1">
                        {clothing.socialPerception.map((tag) => {
                          const config = TAG_COLORS[tag];
                          return (
                            <span
                              key={tag}
                              className={`text-[8px] px-1 py-0.5 rounded ${config.bg} ${config.text} border ${config.border}`}
                            >
                              {TAG_LABELS[tag]}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
