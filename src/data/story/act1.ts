import { applyStoryTexts } from '@/data/narrative/applyStoryTexts';
import { ACT1_STRUCTURE } from './structures/act1.structure';
import act1Texts from './texts/act1.json';

export const STORY_NODES_ACT1 = applyStoryTexts(ACT1_STRUCTURE, act1Texts);
