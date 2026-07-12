/* eslint-disable react-refresh/only-export-components -- co-located helpers and lazy exports */
import { memo } from 'react';
import { motion } from 'framer-motion';
import type { GridNode } from '@/engine/minigame/hacking/hackingGameTypes';
import {
  HACKING_CYAN_COLOR,
  HACKING_CYAN_RGB,
} from '@/components/game/hacking/hackingGamePresentation';

function getNodeStyle(
  node: GridNode,
  isPlayerHere: boolean,
  isScannerHere: boolean,
  isPath: boolean,
  isReachable: boolean,
  isDataCollected: boolean,
): { bg: string; border: string; glow: string; icon: string } {
  if (isPlayerHere) {
    return {
      bg: `rgba(${HACKING_CYAN_RGB}, 0.15)`,
      border: `rgba(${HACKING_CYAN_RGB}, 0.7)`,
      glow: `0 0 15px rgba(${HACKING_CYAN_RGB}, 0.4), inset 0 0 10px rgba(${HACKING_CYAN_RGB}, 0.15)`,
      icon: '◈',
    };
  }
  if (isScannerHere) {
    return {
      bg: 'rgba(251, 146, 60, 0.15)',
      border: 'rgba(251, 146, 60, 0.7)',
      glow: '0 0 15px rgba(251, 146, 60, 0.4), inset 0 0 10px rgba(251, 146, 60, 0.15)',
      icon: '◉',
    };
  }

  switch (node.type) {
    case 'firewall':
      return {
        bg: 'rgba(239, 68, 68, 0.1)',
        border: 'rgba(239, 68, 68, 0.5)',
        glow: '0 0 10px rgba(239, 68, 68, 0.2)',
        icon: '🛡',
      };
    case 'data':
      if (isDataCollected) {
        return {
          bg: 'rgba(34, 197, 94, 0.03)',
          border: 'rgba(34, 197, 94, 0.15)',
          glow: 'none',
          icon: '✓',
        };
      }
      return {
        bg: 'rgba(34, 197, 94, 0.12)',
        border: 'rgba(34, 197, 94, 0.5)',
        glow: '0 0 12px rgba(34, 197, 94, 0.25)',
        icon: '◆',
      };
    case 'target':
      return {
        bg: 'rgba(168, 85, 247, 0.15)',
        border: 'rgba(168, 85, 247, 0.7)',
        glow: '0 0 18px rgba(168, 85, 247, 0.35), inset 0 0 10px rgba(168, 85, 247, 0.1)',
        icon: '⬡',
      };
    default:
      if (isPath) {
        return {
          bg: `rgba(${HACKING_CYAN_RGB}, 0.06)`,
          border: `rgba(${HACKING_CYAN_RGB}, 0.25)`,
          glow: `0 0 6px rgba(${HACKING_CYAN_RGB}, 0.1)`,
          icon: '',
        };
      }
      if (isReachable) {
        return {
          bg: `rgba(${HACKING_CYAN_RGB}, 0.04)`,
          border: `rgba(${HACKING_CYAN_RGB}, 0.35)`,
          glow: `0 0 10px rgba(${HACKING_CYAN_RGB}, 0.15)`,
          icon: '',
        };
      }
      return {
        bg: 'rgba(30, 41, 59, 0.4)',
        border: 'rgba(71, 85, 105, 0.25)',
        glow: 'none',
        icon: '',
      };
  }
}

export function getNetworkNodeAriaLabel(
  node: GridNode,
  isPlayerHere: boolean,
  isScannerHere: boolean,
  isReachable: boolean,
  isDataCollected: boolean,
): string {
  if (isPlayerHere) return 'Ваш пакет';
  if (isScannerHere) return 'Сканер безопасности';
  if (node.type === 'firewall') return 'Файрвол, проход закрыт';
  if (node.type === 'target') return isReachable ? 'Целевой сервер, можно переместиться' : 'Целевой сервер';
  if (node.type === 'data') {
    return isDataCollected ? 'Данные уже собраны' : isReachable ? 'Узел данных, можно переместиться' : 'Узел данных';
  }
  return isReachable ? 'Пустой узел, можно переместиться' : 'Пустой узел';
}

interface HackingNetworkNodeProps {
  node: GridNode;
  isPlayerHere: boolean;
  isScannerHere: boolean;
  isPath: boolean;
  isReachable: boolean;
  isDataCollected: boolean;
  onClick: () => void;
}

export const HackingNetworkNode = memo(function HackingNetworkNode({
  node,
  isPlayerHere,
  isScannerHere,
  isPath,
  isReachable,
  isDataCollected,
  onClick,
}: HackingNetworkNodeProps) {
  const style = getNodeStyle(node, isPlayerHere, isScannerHere, isPath, isReachable, isDataCollected);
  const isClickable = isReachable && !isPlayerHere && node.type !== 'firewall';
  const ariaLabel = getNetworkNodeAriaLabel(node, isPlayerHere, isScannerHere, isReachable, isDataCollected);

  const content = (
    <>
      <div className="absolute inset-0 rounded-md overflow-hidden pointer-events-none" style={{ opacity: 0.3 }}>
        <motion.div
          className="absolute left-0 right-0 h-px"
          style={{
            background: `linear-gradient(90deg, transparent, rgba(${HACKING_CYAN_RGB}, 0.4), transparent)`,
          }}
          animate={{ top: ['0%', '100%'] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        />
      </div>
      <span
        className="relative z-10 text-sm font-mono"
        style={{
          color: isPlayerHere
            ? HACKING_CYAN_COLOR
            : isScannerHere
              ? 'rgba(251, 146, 60, 0.9)'
              : node.type === 'firewall'
                ? 'rgba(239, 68, 68, 0.8)'
                : node.type === 'data'
                  ? isDataCollected
                    ? 'rgba(34, 197, 94, 0.3)'
                    : 'rgba(34, 197, 94, 0.9)'
                  : node.type === 'target'
                    ? 'rgba(168, 85, 247, 0.9)'
                    : 'rgba(100, 116, 139, 0.3)',
          textShadow: isPlayerHere
            ? `0 0 8px rgba(${HACKING_CYAN_RGB}, 0.5)`
            : node.type === 'target'
              ? '0 0 8px rgba(168, 85, 247, 0.5)'
              : 'none',
        }}
        aria-hidden="true"
      >
        {style.icon}
      </span>
    </>
  );

  const motionProps = {
    className: 'relative flex items-center justify-center rounded-md select-none w-full aspect-square',
    style: {
      background: style.bg,
      border: `1.5px solid ${style.border}`,
      boxShadow: style.glow,
    } as const,
    animate:
      isPlayerHere
        ? {
            boxShadow: [
              `0 0 10px rgba(${HACKING_CYAN_RGB}, 0.3), inset 0 0 8px rgba(${HACKING_CYAN_RGB}, 0.1)`,
              `0 0 20px rgba(${HACKING_CYAN_RGB}, 0.5), inset 0 0 12px rgba(${HACKING_CYAN_RGB}, 0.2)`,
              `0 0 10px rgba(${HACKING_CYAN_RGB}, 0.3), inset 0 0 8px rgba(${HACKING_CYAN_RGB}, 0.1)`,
            ],
          }
        : node.type === 'target'
          ? {
              boxShadow: [
                '0 0 12px rgba(168, 85, 247, 0.25), inset 0 0 8px rgba(168, 85, 247, 0.08)',
                '0 0 22px rgba(168, 85, 247, 0.45), inset 0 0 14px rgba(168, 85, 247, 0.15)',
                '0 0 12px rgba(168, 85, 247, 0.25), inset 0 0 8px rgba(168, 85, 247, 0.08)',
              ],
            }
          : isScannerHere
            ? {
                boxShadow: [
                  '0 0 8px rgba(251, 146, 60, 0.2), inset 0 0 6px rgba(251, 146, 60, 0.08)',
                  '0 0 16px rgba(251, 146, 60, 0.4), inset 0 0 10px rgba(251, 146, 60, 0.15)',
                  '0 0 8px rgba(251, 146, 60, 0.2), inset 0 0 6px rgba(251, 146, 60, 0.08)',
                ],
              }
            : {},
    transition:
      isPlayerHere || node.type === 'target' || isScannerHere
        ? { duration: 1.5, repeat: Infinity, ease: 'easeInOut' as const }
        : {},
  };

  if (isClickable) {
    return (
      <motion.button
        type="button"
        {...motionProps}
        onClick={onClick}
        aria-label={ariaLabel}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        className={`${motionProps.className} cursor-pointer`}
      >
        {content}
      </motion.button>
    );
  }

  return (
    <motion.div {...motionProps} aria-label={ariaLabel}>
      {content}
    </motion.div>
  );
});
