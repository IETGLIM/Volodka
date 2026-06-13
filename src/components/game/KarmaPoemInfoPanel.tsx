
/* ─── Volodka RPG – KarmaPoemInfoPanel ─── */
/* Panel that explains karma and poem mechanics to the player.
 * Two tabs: "Карма" and "Стихи".
 * Triggered by first karma change or first poem discovery. */

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FocusTrap } from '@/components/a11y/FocusTrap'
import { usePanelDialog } from '@/components/a11y/usePanelDialog'
import { useKarmaPoemInfoPanelState } from '@/store/selectors'
import { ALL_ENDINGS } from '@/data/goldenPath'
import { TOTAL_UNIFIED_POEMS } from '@/data/unifiedPoemRegistry'
import { QUEST_DEFINITIONS } from '@/data/quests'
import { UI_LAYERS } from '@/shared/constants/uiLayers'

interface KarmaPoemInfoPanelProps {
  open: boolean
  onClose: () => void
}

export function KarmaPoemInfoPanel({ open, onClose }: KarmaPoemInfoPanelProps) {
  const { closeButtonRef, dialogProps, titleProps } = usePanelDialog()
  const [activeTab, setActiveTab] = useState<'karma' | 'poems'>('karma')

  const {
    karma,
    collectedPoems,
    notifications,
    poemPowers,
  } = useKarmaPoemInfoPanelState()

  // Determine which endings are available at current karma
  const availableEndings = useMemo(() => {
    return ALL_ENDINGS.map((ending) => {
      let available = false
      if (ending.id === 'ending_creator' || ending.id === 'ending_rebel') {
        available = karma >= 60
      } else if (ending.id === 'ending_exile') {
        available = karma < 40
      } else if (ending.id === 'ending_machine') {
        // Simplified: always show as potential
        available = true
      } else if (ending.id === 'ending_poet') {
        available = collectedPoems.length >= TOTAL_UNIFIED_POEMS
      }
      return { ...ending, available }
    })
  }, [karma, collectedPoems.length])

  // Recent karma changes from notifications
  const recentKarmaChanges = useMemo(() => {
    return notifications
      .filter((n) => n.type === 'karma')
      .slice(-5)
  }, [notifications])

  // Poem slots (all unified registry entries)
  const poemSlots = useMemo(() => {
    const totalPoems = TOTAL_UNIFIED_POEMS
    return Array.from({ length: totalPoems }, (_, i) => {
      const poemId = `poem_${i + 1}`
      const collected = collectedPoems.includes(poemId)
      return { id: poemId, index: i + 1, collected }
    })
  }, [collectedPoems])

  // Poem power and cooldown info
  const availablePowers = useMemo(() => {
    const now = Date.now()
    return collectedPoems.filter((poemId) => {
      const ps = poemPowers[poemId]
      if (!ps) return true
      return now - ps.lastUsed >= ps.cooldownMs
    })
  }, [collectedPoems, poemPowers])

  // Quests with poem bypass
  const poemBypassQuests = useMemo(() => {
    return QUEST_DEFINITIONS.filter(
      (q) => q.objectives.some((o) => o.poemPowerBypass),
    )
  }, [])

  if (!open) return null

  return (
    <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 flex items-center justify-center"
          style={{ zIndex: UI_LAYERS.PANEL, background: 'rgba(0,0,0,0.85)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose()
          }}
        >
        <FocusTrap initialFocusRef={closeButtonRef}>
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="relative w-[95vw] max-w-[700px] max-h-[85vh] flex flex-col overflow-hidden"
          {...dialogProps}
          style={{
            background: 'linear-gradient(135deg, rgba(0,8,16,0.97), rgba(0,16,24,0.95))',
            border: '1px solid rgba(0,255,238,0.25)',
            borderRadius: '8px',
            boxShadow: '0 0 20px rgba(0,255,238,0.08), inset 0 0 10px rgba(0,255,238,0.03)',
          }}
        >
          <h2 {...titleProps} className="sr-only">Карма и стихи</h2>
          {/* Header with tabs */}
          <div
            className="flex border-b"
            style={{ borderColor: 'rgba(0,255,238,0.15)' }}
          >
            <TabButton
              active={activeTab === 'karma'}
              onClick={() => setActiveTab('karma')}
              label="⚖️ Карма"
            />
            <TabButton
              active={activeTab === 'poems'}
              onClick={() => setActiveTab('poems')}
              label="📜 Стихи"
            />
            {/* Close button */}
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              className="ml-auto px-3 text-xs font-mono"
              style={{ color: '#666' }}
              aria-label="Закрыть"
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6" style={{ scrollbarWidth: 'thin', scrollbarColor: '#00ffee33 transparent' }}>
            {activeTab === 'karma' && (
              <KarmaTab
                karma={karma}
                availableEndings={availableEndings}
                recentChanges={recentKarmaChanges}
              />
            )}
            {activeTab === 'poems' && (
              <PoemsTab
                poemSlots={poemSlots}
                collectedCount={collectedPoems.length}
                availablePowers={availablePowers.length}
                totalPowers={collectedPoems.length}
                poemBypassQuests={poemBypassQuests}
              />
            )}
          </div>
        </motion.div>
        </FocusTrap>
      </motion.div>
    </AnimatePresence>
  )
}

/* ─── Tab button ─── */
function TabButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className="flex-1 py-3 text-sm font-mono tracking-wider transition-colors"
      style={{
        color: active ? '#00ffee' : '#666',
        background: active ? 'rgba(0,255,238,0.08)' : 'transparent',
        borderBottom: active ? '2px solid #00ffee' : '2px solid transparent',
        textShadow: active ? '0 0 8px rgba(0,255,238,0.3)' : 'none',
      }}
    >
      {label}
    </button>
  )
}

/* ─── Karma Tab ─── */
function KarmaTab({
  karma,
  availableEndings,
  recentChanges,
}: {
  karma: number
  availableEndings: Array<{ id: string; title: string; description: string; condition: string; available: boolean }>
  recentChanges: Array<{ id: string; type: string; text: string; timestamp: number }>
}) {
  return (
    <div className="space-y-6">
      {/* Circular karma meter */}
      <div className="flex justify-center">
        <div className="relative">
          <svg viewBox="0 0 120 120" width="160" height="160">
            {/* Background circle */}
            <circle cx="60" cy="60" r="50" fill="none" stroke="#222" strokeWidth="8" />
            {/* Karma arc */}
            <circle
              cx="60"
              cy="60"
              r="50"
              fill="none"
              stroke={karma >= 60 ? '#00ff66' : karma < 40 ? '#ff4444' : '#ffcc00'}
              strokeWidth="8"
              strokeDasharray={`${(karma / 100) * 314.16} 314.16`}
              strokeDashoffset="78.54"
              strokeLinecap="round"
              style={{
                filter: `drop-shadow(0 0 6px ${karma >= 60 ? 'rgba(0,255,102,0.4)' : karma < 40 ? 'rgba(255,68,68,0.4)' : 'rgba(255,204,0,0.4)'})`,
                transition: 'stroke-dasharray 0.5s ease',
              }}
            />
            {/* Value text */}
            <text
              x="60"
              y="58"
              textAnchor="middle"
              dominantBaseline="middle"
              fill={karma >= 60 ? '#00ff66' : karma < 40 ? '#ff4444' : '#ffcc00'}
              fontSize="28"
              fontFamily="monospace"
              fontWeight="bold"
            >
              {karma}
            </text>
            <text
              x="60"
              y="76"
              textAnchor="middle"
              fill="#888"
              fontSize="10"
              fontFamily="monospace"
            >
              КАРМА
            </text>
          </svg>
        </div>
      </div>

      {/* Explanation */}
      <div
        className="text-sm font-mono leading-relaxed px-4 py-3 rounded"
        style={{
          color: '#99bbbb',
          background: 'rgba(0,255,238,0.04)',
          border: '1px solid rgba(0,255,238,0.1)',
        }}
      >
        Карма отражает твой моральный путь. Высокая карма открывает путь Создателя и Повстанца. Низкая — путь Изгнанника.
      </div>

      {/* Available endings */}
      <div>
        <h3 className="text-[11px] font-mono tracking-wider mb-3" style={{ color: '#00ffee88' }}>
          ДОСТУПНЫЕ КОНЦОВКИ:
        </h3>
        <div className="space-y-2">
          {availableEndings.map((ending) => (
            <div
              key={ending.id}
              className="flex items-start gap-3 px-3 py-2 rounded"
              style={{
                background: ending.available ? 'rgba(0,255,238,0.06)' : 'rgba(40,40,40,0.3)',
                border: `1px solid ${ending.available ? 'rgba(0,255,238,0.15)' : 'rgba(60,60,60,0.2)'}`,
                opacity: ending.available ? 1 : 0.5,
              }}
            >
              <span className="text-sm mt-0.5">
                {ending.available ? '🔓' : '🔒'}
              </span>
              <div>
                <div className="text-[12px] font-mono font-bold" style={{ color: ending.available ? '#e0f8f8' : '#666' }}>
                  {ending.title}
                </div>
                <div className="text-[10px] font-mono" style={{ color: '#888' }}>
                  {ending.condition}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent karma changes */}
      {recentChanges.length > 0 && (
        <div>
          <h3 className="text-[11px] font-mono tracking-wider mb-2" style={{ color: '#ffcc4488' }}>
            ПОСЛЕДНИЕ ИЗМЕНЕНИЯ:
          </h3>
          <div className="space-y-1">
            {recentChanges.map((change) => (
              <div key={change.id} className="text-[11px] font-mono" style={{ color: '#aaa' }}>
                {change.text}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Poems Tab ─── */
function PoemsTab({
  poemSlots,
  collectedCount,
  availablePowers,
  totalPowers,
  poemBypassQuests,
}: {
  poemSlots: Array<{ id: string; index: number; collected: boolean }>
  collectedCount: number
  availablePowers: number
  totalPowers: number
  poemBypassQuests: Array<{ id: string; title: string }>
}) {
  return (
    <div className="space-y-6">
      {/* Explanation */}
      <div
        className="text-sm font-mono leading-relaxed px-4 py-3 rounded"
        style={{
          color: '#99ccaa',
          background: 'rgba(0,255,102,0.04)',
          border: '1px solid rgba(0,255,102,0.1)',
        }}
      >
        Стихи — твоя сила в этом мире. Каждое стихотворение даёт особую способность и может открыть закрытые пути.
      </div>

      {/* Poem grid */}
      <div>
        <h3 className="text-[11px] font-mono tracking-wider mb-3" style={{ color: '#00ff6688' }}>
          СОБРАННЫЕ СТИХИ ({collectedCount}/{TOTAL_UNIFIED_POEMS}):
        </h3>
        <div className="grid grid-cols-7 gap-2">
          {poemSlots.map((slot) => (
            <motion.div
              key={slot.id}
              className="aspect-square flex items-center justify-center rounded text-[10px] font-mono"
              style={{
                background: slot.collected
                  ? 'rgba(0,255,102,0.15)'
                  : 'rgba(40,40,40,0.3)',
                border: `1px solid ${slot.collected ? 'rgba(0,255,102,0.3)' : 'rgba(60,60,60,0.2)'}`,
                color: slot.collected ? '#00ff66' : '#444',
                boxShadow: slot.collected ? '0 0 6px rgba(0,255,102,0.15)' : 'none',
              }}
              whileHover={slot.collected ? { scale: 1.1 } : {}}
            >
              {slot.collected ? '📜' : slot.index}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Poem power info */}
      <div>
        <h3 className="text-[11px] font-mono tracking-wider mb-2" style={{ color: '#ffcc4488' }}>
          СИЛА СТИХОВ:
        </h3>
        <div className="flex items-center gap-4 px-3 py-2 rounded" style={{ background: 'rgba(255,204,0,0.04)', border: '1px solid rgba(255,204,0,0.1)' }}>
          <div className="text-center">
            <div className="text-lg font-mono font-bold" style={{ color: '#ffcc66' }}>
              {availablePowers}
            </div>
            <div className="text-[9px] font-mono" style={{ color: '#886' }}>
              Доступно
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-mono font-bold" style={{ color: '#aaa' }}>
              {totalPowers}
            </div>
            <div className="text-[9px] font-mono" style={{ color: '#666' }}>
              Всего
            </div>
          </div>
          <div className="text-[11px] font-mono" style={{ color: '#998' }}>
            Перезарядка: 60 сек
          </div>
        </div>
      </div>

      {/* Poem bypass mechanic explanation */}
      <div>
        <h3 className="text-[11px] font-mono tracking-wider mb-2" style={{ color: '#cc88ff88' }}>
          ОБХОД СТИХАМИ:
        </h3>
        <div
          className="text-[11px] font-mono leading-relaxed px-3 py-2 rounded"
          style={{
            color: '#aa88cc',
            background: 'rgba(204,136,255,0.04)',
            border: '1px solid rgba(204,136,255,0.1)',
          }}
        >
          Некоторые задания можно обойти, применив силу стихотворения. Это позволяет пройти сложные испытания альтернативным путём.
          {poemBypassQuests.length > 0 && (
            <div className="mt-2 space-y-1">
              {poemBypassQuests.map((quest) => (
                <div key={quest.id} style={{ color: '#8877aa' }}>
                  • {quest.title}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
