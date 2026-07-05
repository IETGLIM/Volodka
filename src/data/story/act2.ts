import { applyStoryTexts } from '@/data/narrative/applyStoryTexts';
import { ACT2_STRUCTURE } from './structures/act2.structure';
import act2Texts from './texts/act2.json';

export const STORY_NODES_ACT2 = applyStoryTexts(ACT2_STRUCTURE, act2Texts);
