import { applyStoryTexts } from '@/data/narrative/applyStoryTexts';
import { ACT5_STRUCTURE } from './structures/act5.structure';
import act5Texts from './texts/act5.json';

export const STORY_NODES_ACT5 = applyStoryTexts(ACT5_STRUCTURE, act5Texts);
