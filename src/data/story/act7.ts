import { applyStoryTexts } from '@/data/narrative/applyStoryTexts';
import { ACT7_STRUCTURE } from './structures/act7.structure';
import act7Texts from './texts/act7.json';

export const STORY_NODES_ACT7 = applyStoryTexts(ACT7_STRUCTURE, act7Texts);
