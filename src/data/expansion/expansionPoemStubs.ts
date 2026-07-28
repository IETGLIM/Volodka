/* ─── Expansion poem stubs (exploration fragments, not canonical poem_1–35) ───
 * Placeholder texts until full fragments are authored. Does not modify poems.ts.
 */

import type { Poem } from '@/shared/types/game';

function stubPoem(
  id: string,
  title: string,
  order: number,
  unlocksAt = 'start',
): Poem {
  return {
    id,
    title,
    author: 'Неизвестный поэт кода',
    order,
    unlocksAt,
    themes: ['фрагмент', 'расширение'],
    intro: 'Фрагмент стиха, найденный в расширенном контенте.',
    bonus: true,
    lines: [
      'Строка ещё не восстановлена —',
      'но след в логах уже горит.',
      'Когда-нибудь здесь будет полный текст.',
    ],
  };
}

export const EXPANSION_POEM_STUBS: Poem[] = [
  stubPoem('poem_36', 'Под подушкой', 36, 'examine_bed_pillow'),
  stubPoem('poem_37', 'Отражение', 37, 'examine_mirror_thought'),
  stubPoem('poem_street_fragment', 'Уличный фрагмент', 101, 'act2_exp_street_neon_signs'),
  stubPoem('poem_server_comment', 'Комментарий в логе', 102, 'act2_exp_office_server_room'),
  stubPoem('poem_elis_song', 'Песня Элис', 103, 'act2_exp_chk_elis_song'),
  stubPoem('poem_ascii_art', 'ASCII-стих', 104, 'act2_exp_office_old_terminal'),
  stubPoem('poem_vendor_thermal', 'Тепловой отпечаток', 105, 'act2_exp_street_vendor'),
  stubPoem('poem_lebedev_archive', 'Архивная строка', 106, 'act2_exp_chk_basement_archive'),
  stubPoem('poem_wall_handwritten', 'На стене кафе', 107, 'act2_exp_cafe_poetry_wall'),
  stubPoem('poem_river_frequency', 'Частота реки', 108, 'act2_exp_pier_sunrise_poem'),
  stubPoem('poem_restored_fragment', 'Восстановленный осколок', 109, 'act5_exp_factory_memory_fragment'),
  stubPoem('poem_zarya_dream', 'Сон Зари-М', 110, 'act5_exp_factory_machine_dream'),
  stubPoem('poem_zarya_awakening', 'Пробуждение Зари-М', 111, 'act5_exp_factory_zarya_awakening'),
];

const EXPANSION_POEM_MAP = new Map(EXPANSION_POEM_STUBS.map((p) => [p.id, p]));

export const EXPANSION_POEM_IDS = EXPANSION_POEM_STUBS.map((p) => p.id);

export function getExpansionPoemStub(id: string): Poem | undefined {
  return EXPANSION_POEM_MAP.get(id);
}
