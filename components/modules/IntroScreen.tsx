import { Wind } from 'lucide-react';

interface IntroScreenProps {
  onChangeTab: (tab: string) => void;
}

export function IntroScreen({ onChangeTab }: IntroScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-8">
      <div className="space-y-4">
        <h1 className="text-3xl md:text-5xl font-light text-stone-200 tracking-wide">
          迷雾漫步者
        </h1>
        <p className="text-neutral-500 font-mono text-xs md:text-sm tracking-widest uppercase">
          Anti-Algorithm / Anti-Speed / Anti-Echo
        </p>
      </div>

      <div className="w-px h-16 bg-gradient-to-b from-transparent via-neutral-700 to-transparent"></div>

      <p className="max-w-md text-stone-400 leading-relaxed font-light italic">
        "在这里，新闻是陈旧的，推荐是随机的，观点是冲突的。<br/>
        我们不提供真相，只提供寻找真相所需的<span className="text-stone-200 border-b border-stone-600 pb-0.5">阻力</span>。"
      </p>

      <button
        onClick={() => onChangeTab('sediment')}
        className="mt-8 border border-neutral-700 text-neutral-400 hover:text-stone-200 hover:border-stone-500 px-8 py-3 text-sm tracking-widest transition-all duration-500"
      >
        进入迷雾
      </button>
    </div>
  );
}
