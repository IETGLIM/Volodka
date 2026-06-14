export function CRTSweep() {
  return (
    <div className="absolute inset-0 pointer-events-none z-[40] overflow-hidden">
      <div
        className="crt-sweep-line absolute left-0 right-0 top-0 h-[2px] bg-[linear-gradient(90deg,transparent_5%,rgba(0,255,255,0.2)_30%,rgba(0,255,255,0.3)_50%,rgba(0,255,255,0.2)_70%,transparent_95%)] shadow-[0_0_20px_rgba(0,255,255,0.15),0_-4px_12px_rgba(0,255,255,0.05)]"
      />
    </div>
  );
}
