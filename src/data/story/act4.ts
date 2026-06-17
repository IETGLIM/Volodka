import { applyStoryTexts } from '@/data/narrative/applyStoryTexts';
import { ACT4_STRUCTURE } from './structures/act4.structure';
import act4Texts from './texts/act4.json';

export const STORY_NODES_ACT4 = applyStoryTexts(ACT4_STRUCTURE, act4Texts);
