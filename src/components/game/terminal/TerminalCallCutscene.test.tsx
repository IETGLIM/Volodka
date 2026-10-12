import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { TerminalCallCutscene } from '@/components/game/terminal/TerminalCallCutscene';
import { eventBus } from '@/engine/EventBus';
import {
  TERMINAL_CALL_CUTSCENE_ID,
  beginTerminalCall,
  cancelTerminalCall,
  completeTerminalCall,
} from '@/engine/interaction/terminalCallFlow';
import { useCutsceneStore } from '@/store/stores/cutsceneStore';
import {
  bindStoreLifecycleHost,
  resetStoreLifecycleHostForTests,
} from '@/shared/gameBridge/storeLifecycleHost';
import type { TriggerZone } from '@/data/triggerZones';

const TERMINAL_ZONE: TriggerZone = {
  id: 'room_terminal',
  sceneId: 'volodka_room',
  position: [0.72, 0.5, -2.62],
  size: [0.38, 0.9, 0.32],
  interactionType: 'hack',
  linkedMinigame: 'codebreaker',
} as unknown as TriggerZone;

describe('TerminalCallCutscene', () => {
  // Engine→Store goes through the lifecycle bridge; bind the real cutscene
  // slice the same way bootstrap does so the cutscene phase is observable.
  beforeAll(() => {
    bindStoreLifecycleHost({
      resetPlayerXpBatch: () => {},
      setActiveCutscene: (id) => {
        useCutsceneStore.getState().setCutscene(id, []);
      },
    });
  });
  afterAll(() => {
    resetStoreLifecycleHostForTests();
  });

  beforeEach(() => {
    cancelTerminalCall();
    useCutsceneStore.getState().setCutscene(null, []);
  });

  it('opens on terminal_call:start with the boot log, then the call channel', async () => {
    render(<TerminalCallCutscene />);
    expect(screen.queryByTestId('terminal-call-cutscene')).toBeNull();

    act(() => {
      eventBus.emit('terminal_call:start', {});
    });

    const dialog = screen.getByTestId('terminal-call-cutscene');
    expect(dialog).toHaveAttribute('role', 'dialog');
    expect(dialog.getAttribute('aria-label')).toContain('4729');
    // Boot stage types the bash session.
    await waitFor(() => {
      expect(screen.getByText(/root@volodka:~# /)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('skip button closes the overlay and releases the cutscene phase', async () => {
    render(<TerminalCallCutscene />);
    act(() => {
      beginTerminalCall(TERMINAL_ZONE);
    });
    expect(useCutsceneStore.getState().activeCutsceneId).toBe(TERMINAL_CALL_CUTSCENE_ID);

    await waitFor(() => {
      expect(screen.getByTestId('terminal-call-cutscene')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('terminal-call-skip'));

    await waitFor(() => {
      expect(screen.queryByTestId('terminal-call-cutscene')).toBeNull();
    });
    // Cutscene phase cleared (locomotion unlocked) — the QTE chain resumes.
    expect(useCutsceneStore.getState().activeCutsceneId).toBeNull();
  });

  it('end event (cancel path) closes the overlay without resuming', async () => {
    render(<TerminalCallCutscene />);
    act(() => {
      beginTerminalCall(TERMINAL_ZONE);
    });
    await waitFor(() => {
      expect(screen.getByTestId('terminal-call-cutscene')).toBeInTheDocument();
    });
    act(() => {
      cancelTerminalCall();
    });
    await waitFor(() => {
      expect(screen.queryByTestId('terminal-call-cutscene')).toBeNull();
    });
  });

  it('full playthrough reaches the call stage with colleagues chat', { timeout: 25000 }, async () => {
    render(<TerminalCallCutscene />);
    act(() => {
      beginTerminalCall(TERMINAL_ZONE);
    });
    // Boot → call transition is timer-driven; wait for the chat feed.
    await waitFor(() => {
      expect(screen.getByText(/<Александр>/)).toBeInTheDocument();
    }, { timeout: 12000 });
    await waitFor(() => {
      expect(screen.getByText(/<Дмитрий>/)).toBeInTheDocument();
    }, { timeout: 12000 });
    // Close cleanly.
    act(() => {
      completeTerminalCall();
    });
    await waitFor(() => {
      expect(screen.queryByTestId('terminal-call-cutscene')).toBeNull();
    });
  });
});
