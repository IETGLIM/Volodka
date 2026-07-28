/* ─── NPC portrait color palette ─── */

export interface NPCPortraitColors {
  primary: string;
  glow: string;
  accent: string;
  bg: string;
}

export const NPC_PORTRAIT_COLORS: Record<string, NPCPortraitColors> = {
  albert: { primary: '#8b9dc3', glow: 'rgba(139,157,195,0.4)', accent: '#6b7db3', bg: 'rgba(139,157,195,0.1)' },
  zarema: { primary: '#e8a87c', glow: 'rgba(232,168,124,0.4)', accent: '#d4896a', bg: 'rgba(232,168,124,0.1)' },
  maria: { primary: '#c77dba', glow: 'rgba(199,125,186,0.4)', accent: '#a85d99', bg: 'rgba(199,125,186,0.1)' },
  office_dmitry: { primary: '#7dad7a', glow: 'rgba(125,173,122,0.4)', accent: '#5d8d5a', bg: 'rgba(125,173,122,0.1)' },
  office_alexander: { primary: '#6b8fc4', glow: 'rgba(107,143,196,0.4)', accent: '#4a6fa4', bg: 'rgba(107,143,196,0.1)' },
  office_colleague: { primary: '#a0926b', glow: 'rgba(160,146,107,0.4)', accent: '#80724b', bg: 'rgba(160,146,107,0.1)' },
  cafe_barista: { primary: '#c4956a', glow: 'rgba(196,149,106,0.4)', accent: '#a4754a', bg: 'rgba(196,149,106,0.1)' },
};
