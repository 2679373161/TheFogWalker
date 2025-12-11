import { useState } from 'react';

interface NavBtnProps {
  id: string;
  icon: React.ElementType;
  label: string;
  active: string;
  set: (id: string) => void;
}

export function NavBtn({ id, icon: Icon, label, active, set }: NavBtnProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={() => set(id)}
      className={`group relative flex flex-col items-center gap-1 transition-all duration-500 ${
        active === id ? 'text-stone-200' : 'text-neutral-600 hover:text-stone-400'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Icon
        strokeWidth={1.5}
        className={`w-5 h-5 transition-transform ${
          active === id ? 'scale-110' : 'scale-100'
        }`}
      />
      <span className={`text-[10px] tracking-widest whitespace-nowrap bg-neutral-800 px-2 py-1 rounded text-neutral-400 transition-all duration-300 absolute -top-6 ${
        isHovered ? 'opacity-100' : 'opacity-0'
      }`}>
        {label}
      </span>
      {active === id && (
        <span className="absolute -bottom-2 w-1 h-1 bg-stone-500 rounded-full" />
      )}
    </button>
  );
}
