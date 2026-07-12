import { applyStoryTexts } from '@/data/narrative/applyStoryTexts';
import { ACT3_STRUCTURE } from './structures/act3.structure';
import act3Texts from './texts/act3.json';

export const STORY_NODES_ACT3 = applyStoryTexts(ACT3_STRUCTURE, act3Texts);
