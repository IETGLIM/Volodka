import { applyStoryTexts } from '@/data/narrative/applyStoryTexts';
import { ACT6_STRUCTURE } from './structures/act6.structure';
import act6Texts from './texts/act6.json';

export const STORY_NODES_ACT6 = applyStoryTexts(ACT6_STRUCTURE, act6Texts);
