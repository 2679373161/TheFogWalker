import { useState, useEffect } from 'react';
import { Shuffle, Wind, Lock } from 'lucide-react';
import { WormholeContent } from '@/types/content';

export function Wormhole() {
  const [content, setContent] = useState<WormholeContent | null>(null);
  const [timer, setTimer] = useState(30);
  const [canLeave, setCanLeave] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadContent = () => {
    setLoading(true);
    setError(null);

    fetch('/api/wormhole')
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          setContent(result.data);
          setTimer(30);
          setCanLeave(false);
          setLoading(false);
        } else {
          setError(result.message || '无法获取内容');
          setLoading(false);
        }
      })
      .catch(err => {
        console.error('Failed to fetch:', err);
        setError('加载失败，请检查网络连接');
        setLoading(false);
      });
  };

  useEffect(() => {
    loadContent();
  }, []);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer(t => t - 1), 1000);
      return () => clearInterval(interval);
    } else {
      setCanLeave(true);
    }
  }, [timer]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-[70vh] justify-center">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-400"></div>
        </div>
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="flex flex-col min-h-[70vh] justify-center text-red-500">
        {error || '加载失败'}
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[70vh] justify-between">
      <header className="flex justify-between items-start border-b border-neutral-800 pb-4 mb-8">
        <h2 className="text-lg font-light text-stone-400 flex items-center gap-2">
          <Shuffle className="w-4 h-4" /> 虫洞 #{Math.floor(Math.random() * 10000)}
        </h2>
        <div className="text-xs font-mono text-neutral-600">
          来源: 未知节点
        </div>
      </header>

      <article className="flex-1 flex flex-col justify-center space-y-6 animate-in zoom-in-95 duration-700">
        <div className="mx-auto w-12 h-12 border border-neutral-800 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl">🏺</span>
        </div>
        <h3 className="text-2xl md:text-3xl text-center font-serif text-stone-200">
          {content.title}
        </h3>
        <div className="w-10 h-1 bg-stone-800 mx-auto my-4"></div>
        <p className="text-base md:text-lg leading-loose text-stone-400 font-light text-justify px-4 md:px-12">
          {content.content}
        </p>
        <p className="text-center text-xs font-mono text-neutral-600 mt-8">
          {content.tag}
        </p>
      </article>

      <div className="mt-12 flex justify-center">
        <button
          disabled={!canLeave}
          onClick={loadContent}
          className={`
            px-6 py-3 border text-sm tracking-widest transition-all duration-500 flex items-center gap-3
            ${canLeave
              ? 'border-stone-600 text-stone-300 hover:bg-stone-900 cursor-pointer'
              : 'border-neutral-800 text-neutral-700 cursor-not-allowed'}
          `}
        >
          {canLeave ? (
            <>
              <span>跃迁至下一坐标</span>
              <Wind className="w-4 h-4" />
            </>
          ) : (
            <>
              <Lock className="w-3 h-3" />
              <span>驻留中 {timer}s</span>
            </>
          )}
        </button>
      </div>
      <p className="text-center text-[10px] text-neutral-700 mt-4">
        * 为防止思维快进，您必须在此停留至少 30 秒。
      </p>
    </div>
  );
}
