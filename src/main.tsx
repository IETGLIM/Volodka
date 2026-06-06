import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { GamePage } from '@/components/game/GamePage';
import { Toaster } from '@/components/ui/sonner';
import '@/app/globals.css';
import { markAppStart } from '@/engine/performance/LoadingTimeline';

markAppStart();

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

createRoot(root).render(
  <StrictMode>
    <GamePage />
    <Toaster position="top-right" richColors />
  </StrictMode>,
);
