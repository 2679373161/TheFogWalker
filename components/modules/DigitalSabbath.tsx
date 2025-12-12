import { BookOpen } from 'lucide-react';

interface DigitalSabbathProps {
  onUnlock: () => void;
}

export function DigitalSabbath({ onUnlock }: DigitalSabbathProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center text-stone-500 p-8 animate-in fade-in duration-1000" style={{ width: '100%', height: '100%' }}>
      <div className="max-w-md text-center space-y-12">
        <BookOpen className="w-12 h-12 mx-auto text-stone-800" />

        <div className="space-y-6">
          <h1 className="text-2xl font-light text-stone-300 tracking-widest">
            DIGITAL SABBATH
          </h1>
          <div className="w-8 h-px bg-stone-800 mx-auto"></div>
          <p className="text-sm font-light leading-loose">
            外面天气不错，去走走吧。<br/>
            或者去看看窗外的树。<br/><br/>
            什么都没发生，<br/>
            即使发生了也与你无关。
          </p>
        </div>

        <div className="pt-24">
          <p className="text-[10px] font-mono text-stone-800 uppercase tracking-[0.3em]">
            System Locked for Recovery
          </p>
        </div>

        {/* 隐藏的解锁按钮，仅演示用 */}
        <button
          onClick={onUnlock}
          className="absolute bottom-8 right-8 text-stone-900 hover:text-stone-800 text-xs"
        >
          [Dev: Force Unlock]
        </button>
      </div>
    </div>
  );
}
