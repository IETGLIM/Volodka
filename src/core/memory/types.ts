export type MemoryType = 'event' | 'dialogue' | 'emotion' | 'relationship';

export type MemoryEmotion =
  | 'neutral'
  | 'happy'
  | 'sad'
  | 'regret'
  | 'love'
  | 'anger';

export type Memory = {
  id: string;
  type: MemoryType;
  timestamp: number;
  title: string;
  description: string;
  relatedEntityId?: string;
  emotion?: MemoryEmotion;
  /** 0..1 — насколько ярко пережит момент */
  intensity?: number;
  tags?: string[];
  persistent?: boolean;
};
