type CyberSpinnerProps = {
  pulse?: boolean;
};

export function CyberSpinner({ pulse = true }: CyberSpinnerProps) {
  return (
    <div className={`relative w-24 h-24 ${pulse ? 'loading-spinner-pulse' : ''}`}>
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full animate-[cyber-spinner_10s_linear_infinite]">
        <polygon points="50,5 95,35 95,65 50,95 5,65 5,35" fill="none" stroke="rgb(var(--cyber-cyan-rgb) / 0.3)" strokeWidth="0.8" />
        <line x1="50" y1="5" x2="50" y2="95" stroke="rgb(var(--cyber-cyan-rgb) / 0.08)" strokeWidth="0.4" />
        <line x1="5" y1="50" x2="95" y2="50" stroke="rgb(var(--cyber-cyan-rgb) / 0.08)" strokeWidth="0.4" />
        <circle cx="50" cy="5" r="1.8" fill="rgb(var(--cyber-cyan-rgb) / 0.6)" />
        <circle cx="95" cy="35" r="1.2" fill="rgb(var(--cyber-cyan-rgb) / 0.4)" />
        <circle cx="95" cy="65" r="1.2" fill="rgb(var(--cyber-cyan-rgb) / 0.4)" />
        <circle cx="50" cy="95" r="1.8" fill="rgb(var(--cyber-cyan-rgb) / 0.6)" />
        <circle cx="5" cy="65" r="1.2" fill="rgb(var(--cyber-cyan-rgb) / 0.4)" />
        <circle cx="5" cy="35" r="1.2" fill="rgb(var(--cyber-cyan-rgb) / 0.4)" />
      </svg>
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full animate-[cyber-spinner-reverse_7s_linear_infinite]">
        <polygon points="50,15 85,50 50,85 15,50" fill="none" stroke="rgba(251,191,36,0.2)" strokeWidth="0.6" />
        <circle cx="50" cy="15" r="1" fill="rgba(251,191,36,0.5)" />
        <circle cx="85" cy="50" r="1" fill="rgba(251,191,36,0.4)" />
        <circle cx="50" cy="85" r="1" fill="rgba(251,191,36,0.5)" />
        <circle cx="15" cy="50" r="1" fill="rgba(251,191,36,0.4)" />
      </svg>
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full animate-[cyber-pulse-ring_3s_ease-in-out_infinite]">
        <circle cx="50" cy="50" r="18" fill="none" stroke="rgb(var(--cyber-cyan-rgb) / 0.15)" strokeWidth="0.5" />
        <circle cx="50" cy="50" r="2" fill="rgb(var(--cyber-cyan-rgb) / 0.4)" />
      </svg>
    </div>
  );
}
