type SettingsToggleProps = {
  label: string;
  enabled: boolean;
  onToggle: () => void;
  enabledClassName?: string;
  ariaLabel?: string;
};

export function SettingsToggle({
  label,
  enabled,
  onToggle,
  enabledClassName = 'border-cyan-500/40 bg-cyan-950/30 text-cyan-300',
  ariaLabel,
}: SettingsToggleProps) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-slate-300 font-mono">{label}</span>
      <button
        type="button"
        onClick={onToggle}
        aria-label={ariaLabel ?? `${label}: ${enabled ? 'включено' : 'выключено'}`}
        aria-pressed={enabled}
        className={`px-3 py-1.5 text-xs font-mono border rounded transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400/70 focus-visible:outline-offset-2 ${
          enabled ? enabledClassName : 'border-slate-700/40 bg-slate-900/30 text-slate-500'
        }`}
      >
        {enabled ? 'ВКЛ' : 'ВЫКЛ'}
      </button>
    </div>
  );
}
