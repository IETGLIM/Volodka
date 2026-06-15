import { isMainPoemId, TOTAL_MAIN_POEMS } from '@/data/poemCollectionMeta';

export interface TrueEndEpilogueInput {
  flags: Readonly<Record<string, boolean | undefined>>;
  collectedPoems: readonly string[];
}

interface EpilogueReflection {
  readonly priority: number;
  readonly when: (input: TrueEndEpilogueInput) => boolean;
  readonly line: string;
}

const MAX_REFLECTION_LINES = 3;

const EPILOGUE_REFLECTIONS: readonly EpilogueReflection[] = [
  {
    priority: 10,
    when: ({ flags }) => flags.ending_true_poet === true,
    line: 'Ты оставил поэзию — и город читает твои строки вслух.',
  },
  {
    priority: 11,
    when: ({ flags }) => flags.ending_true_guardian === true,
    line: 'Ты восстановил гильдию — устав написан стихами и кодом.',
  },
  {
    priority: 12,
    when: ({ flags }) => flags.ending_true_wanderer === true,
    line: 'Ты ушёл в дорогу — но город помнит твой след.',
  },
  {
    priority: 20,
    when: ({ collectedPoems }) =>
      collectedPoems.filter(isMainPoemId).length >= TOTAL_MAIN_POEMS,
    line: 'Все двадцать одна строка Владимира с тобой — путь поэта замкнут.',
  },
  {
    priority: 30,
    when: ({ flags }) =>
      flags.zarema_rescued === true || flags.quiet_tea_zarema === true,
    line: 'Зарема печёт пирог — некоторые спасения не помещаются в архив.',
  },
  {
    priority: 31,
    when: ({ flags }) => flags.dmitry_forgiven === true,
    line: 'Дмитрий работает рядом — прощение оказалось сильнее предательства.',
  },
  {
    priority: 32,
    when: ({ flags }) =>
      flags.traitor_revealed === true && flags.dmitry_forgiven !== true,
    line: 'Предательство Дмитрия оставило шрам — но сопротивление выстояло.',
  },
  {
    priority: 33,
    when: ({ flags }) => flags.maria_truth_accepted === true,
    line: 'Виктория улыбается из сети — ты поверил в её человечность.',
  },
  {
    priority: 40,
    when: ({ flags }) => flags.tolpa_honorary_chekist === true,
    line: 'У костра на Зорге Ру поднимает кружку — ЧК не забывает своих.',
  },
  {
    priority: 41,
    when: ({ flags }) => flags.zarya_freed === true,
    line: '«Заря-М» пишет в подвале — уже не по приказу, а по совести.',
  },
  {
    priority: 42,
    when: ({ flags }) => flags.zarya_shutdown === true,
    line: 'Экран «Зари-М» погас тихо — стихи вернулись к людям.',
  },
] as const;

/** Append up to three personalized lines to the true ending (flags + poem collection). */
export function buildTrueEndEpilogueReflection(input: TrueEndEpilogueInput): string {
  const lines = EPILOGUE_REFLECTIONS
    .filter((entry) => entry.when(input))
    .sort((a, b) => a.priority - b.priority)
    .slice(0, MAX_REFLECTION_LINES)
    .map((entry) => entry.line);

  return lines.join('\n');
}

export function appendTrueEndEpilogueReflection(
  baseText: string,
  input: TrueEndEpilogueInput,
): string {
  const reflection = buildTrueEndEpilogueReflection(input);
  if (!reflection) return baseText;
  return `${baseText}\n\n${reflection}`;
}
