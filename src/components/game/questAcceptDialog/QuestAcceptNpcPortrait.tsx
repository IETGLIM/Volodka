import type { NPCDefinition } from '@/shared/types/game';
import { QUEST_ACCEPT_DIALOG_LABELS } from '@/engine/quest/questAcceptDialogConstants';

type QuestAcceptBracketCornersProps = {
  color: string;
  size: number;
};

export function QuestAcceptBracketCorners({ color, size }: QuestAcceptBracketCornersProps) {
  return (
    <div aria-hidden="true">
      <div
        className="absolute pointer-events-none"
        style={{ top: 0, left: 0, width: size, height: size, borderTop: `2px solid ${color}`, borderLeft: `2px solid ${color}` }}
      />
      <div
        className="absolute pointer-events-none"
        style={{ top: 0, right: 0, width: size, height: size, borderTop: `2px solid ${color}`, borderRight: `2px solid ${color}` }}
      />
      <div
        className="absolute pointer-events-none"
        style={{ bottom: 0, left: 0, width: size, height: size, borderBottom: `2px solid ${color}`, borderLeft: `2px solid ${color}` }}
      />
      <div
        className="absolute pointer-events-none"
        style={{ bottom: 0, right: 0, width: size, height: size, borderBottom: `2px solid ${color}`, borderRight: `2px solid ${color}` }}
      />
    </div>
  );
}

type QuestAcceptNpcPortraitProps = {
  npcDef: NPCDefinition | null;
  reducedMotion: boolean;
};

export function QuestAcceptNpcPortrait({ npcDef, reducedMotion }: QuestAcceptNpcPortraitProps) {
  const bodyColor = npcDef?.appearance?.bodyColor ?? '#6a6a7a';
  const accentColor = npcDef?.appearance?.accentColor ?? '#9a9aaa';
  const glowColor = npcDef?.appearance?.glowColor ?? '#ffffff';
  const accessory = npcDef?.appearance?.headAccessory ?? 'none';
  const silhouette = npcDef?.appearance?.silhouette ?? 'average';

  const bodyRx = silhouette === 'heavy' ? 48 : silhouette === 'slim' ? 32 : 40;
  const bodyRy = silhouette === 'heavy' ? 35 : silhouette === 'slim' ? 28 : 30;
  const headRx = silhouette === 'heavy' ? 38 : silhouette === 'slim' ? 30 : 35;
  const headRy = silhouette === 'heavy' ? 42 : silhouette === 'slim' ? 38 : 40;

  const portraitLabel = npcDef
    ? QUEST_ACCEPT_DIALOG_LABELS.npcPortrait(npcDef.name)
    : QUEST_ACCEPT_DIALOG_LABELS.unknownGiverPortrait;

  if (!npcDef) {
    return (
      <div className="relative" style={{ width: '200px', height: '200px' }}>
        <div
          className="absolute inset-0 rounded-lg"
          aria-hidden="true"
          style={{
            background: 'radial-gradient(circle, rgba(100,100,120,0.1) 0%, transparent 70%)',
          }}
        />
        <svg viewBox="0 0 200 200" className="w-full h-full" role="img" aria-label={portraitLabel}>
          <title>{portraitLabel}</title>
          <desc>{QUEST_ACCEPT_DIALOG_LABELS.npcPortraitDesc}</desc>
          <circle cx="100" cy="100" r="95" fill="none" stroke="rgba(100,100,120,0.3)" strokeWidth="1" />
          <circle cx="100" cy="100" r="90" fill="rgba(50,50,60,0.15)" />
          <ellipse cx="100" cy="160" rx="40" ry="30" fill="rgba(100,100,120,0.3)" />
          <rect x="90" y="120" width="20" height="25" fill="rgba(100,100,120,0.4)" rx="4" />
          <ellipse cx="100" cy="90" rx="35" ry="40" fill="rgba(100,100,120,0.5)" />
          <text x="100" y="98" textAnchor="middle" fontSize="40" fill="rgba(150,150,170,0.5)" fontWeight="bold">
            ?
          </text>
        </svg>
        <div
          className="absolute inset-0 rounded-lg pointer-events-none"
          aria-hidden="true"
          style={{
            boxShadow: 'inset 0 0 20px rgba(100,100,120,0.05), 0 0 10px rgba(100,100,120,0.03)',
            border: '1px solid rgba(100,100,120,0.2)',
            borderRadius: '8px',
          }}
        />
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-lg" style={{ width: '200px', height: '200px' }}>
      <div
        className="absolute inset-0 rounded-lg"
        aria-hidden="true"
        style={{
          background: `radial-gradient(circle, ${glowColor}11 0%, transparent 70%)`,
        }}
      />

      {!reducedMotion && (
        <div className="quest-accept-holo-shimmer absolute inset-0 pointer-events-none" aria-hidden="true" style={{ zIndex: 2 }} />
      )}

      <svg
        viewBox="0 0 200 200"
        className="w-full h-full"
        style={{ position: 'relative', zIndex: 1 }}
        role="img"
        aria-label={portraitLabel}
      >
        <title>{npcDef.name}</title>
        <desc>{QUEST_ACCEPT_DIALOG_LABELS.npcPortraitDesc}</desc>
        <circle cx="100" cy="100" r="95" fill="none" stroke={`${accentColor}44`} strokeWidth="1" />
        <circle cx="100" cy="100" r="90" fill={`${bodyColor}22`} />
        <ellipse cx="100" cy="160" rx={bodyRx} ry={bodyRy} fill={bodyColor} opacity="0.6" />
        <rect x="90" y="120" width="20" height="25" fill={bodyColor} opacity="0.7" rx="4" />
        <ellipse cx="100" cy="90" rx={headRx} ry={headRy} fill={bodyColor} opacity="0.8" />
        <ellipse cx="87" cy="85" rx="5" ry="3" fill={accentColor} opacity="0.9" />
        <ellipse cx="113" cy="85" rx="5" ry="3" fill={accentColor} opacity="0.9" />
        <ellipse cx="87" cy="85" rx="3" ry="2" fill={glowColor} opacity="0.6" />
        <ellipse cx="113" cy="85" rx="3" ry="2" fill={glowColor} opacity="0.6" />

        {accessory === 'glasses' && (
          <>
            <rect x="75" y="78" width="20" height="10" rx="3" fill="none" stroke={accentColor} strokeWidth="2" opacity="0.7" />
            <rect x="105" y="78" width="20" height="10" rx="3" fill="none" stroke={accentColor} strokeWidth="2" opacity="0.7" />
            <line x1="95" y1="83" x2="105" y2="83" stroke={accentColor} strokeWidth="1.5" opacity="0.7" />
            <line x1="78" y1="80" x2="82" y2="80" stroke={`${glowColor}44`} strokeWidth="1" />
            <line x1="108" y1="80" x2="112" y2="80" stroke={`${glowColor}44`} strokeWidth="1" />
          </>
        )}

        {accessory === 'hat' && (
          <>
            <ellipse cx="100" cy="55" rx="42" ry="8" fill={accentColor} opacity="0.6" />
            <rect x="80" y="35" width="40" height="20" rx="5" fill={accentColor} opacity="0.7" />
            <rect x="80" y="50" width="40" height="4" rx="1" fill={`${glowColor}44`} />
          </>
        )}

        {accessory === 'scarf' && (
          <>
            <path d="M 75 115 Q 100 130 125 115" fill="none" stroke={accentColor} strokeWidth="6" opacity="0.7" />
            <path d="M 120 118 Q 130 135 125 150" fill="none" stroke={accentColor} strokeWidth="4" opacity="0.5" />
          </>
        )}

        {accessory === 'earring' && (
          <>
            <circle cx="65" cy="95" r="3" fill={accentColor} opacity="0.8" />
            <circle cx="65" cy="100" r="2" fill={glowColor} opacity="0.6" />
            <line x1="67" y1="90" x2="65" y2="93" stroke={accentColor} strokeWidth="1" opacity="0.6" />
          </>
        )}

        <line x1="30" y1="40" x2="55" y2="40" stroke={`${accentColor}33`} strokeWidth="0.5" />
        <line x1="35" y1="55" x2="60" y2="55" stroke={`${accentColor}22`} strokeWidth="0.5" />
        <line x1="140" y1="45" x2="170" y2="45" stroke={`${accentColor}33`} strokeWidth="0.5" />
        <line x1="145" y1="60" x2="165" y2="60" stroke={`${accentColor}22`} strokeWidth="0.5" />
        <line x1="68" y1="105" x2="80" y2="115" stroke={`${accentColor}22`} strokeWidth="0.5" />
        <line x1="132" y1="105" x2="120" y2="115" stroke={`${accentColor}22`} strokeWidth="0.5" />
      </svg>

      <div
        className="absolute inset-0 rounded-lg pointer-events-none"
        aria-hidden="true"
        style={{
          boxShadow: `inset 0 0 20px ${glowColor}11, 0 0 10px ${glowColor}08`,
          border: `1px solid ${accentColor}33`,
          borderRadius: '8px',
          zIndex: 3,
        }}
      />
    </div>
  );
}
