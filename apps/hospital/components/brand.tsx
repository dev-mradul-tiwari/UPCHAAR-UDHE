export function Brand({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <svg
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="size-7"
      >
        <rect x="2" y="2" width="28" height="28" rx="6" fill="currentColor" />
        <path
          d="M16 8v16M12 12h8M12 20h8"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <svg
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="size-7"
      >
        <rect x="2" y="2" width="28" height="28" rx="6" fill="currentColor" />
        <path
          d="M16 8v16M12 12h8M12 20h8"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div className="flex flex-col leading-tight">
        <span className="text-sm font-bold">Upchaar</span>
        <span className="text-xs font-medium opacity-60">Hospital</span>
      </div>
    </div>
  );
}
