import type { Metadata } from 'next';
import { GamePage } from '@/components/game/GamePage';

export const metadata: Metadata = {
  title: 'Володька — Киберпанк RPG',
  description: 'Киберпанк RPG о поэте-программисте в городе, где стихи — оружие',
};

export default function Home() {
  return <GamePage />;
}
