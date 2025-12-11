import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { SedimentItem } from '@/types/content';

export function SedimentFilter() {
  const [data, setData] = useState<SedimentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/sediment')
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          setData(result.data);
        } else {
          setError(result.message || '无法获取内容');
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch:', err);
        setError('加载失败，请检查网络连接');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-400"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <header className="border-l-2 border-stone-800 pl-6 py-2">
        <h2 className="text-xl font-light text-stone-300 flex items-center gap-3">
          <Clock className="w-5 h-5 text-stone-600" />
          沉淀池
        </h2>
        <p className="text-xs text-neutral-500 mt-2 font-mono">
          过滤器状态：已拦截过去 7 天内的 14,203 条噪音。<br/>
          仅展示经受住时间冲刷的残留物。
        </p>
      </header>

      <div className="space-y-16">
        {data.map((item) => (
          <article key={item.id} className="group relative">
            <div className="absolute -left-10 top-1 text-xs font-mono text-neutral-700 -rotate-90 origin-right w-8">
              {item.date}
            </div>
            <div className="space-y-3">
              <span className="inline-block px-2 py-1 border border-neutral-800 text-[10px] text-neutral-500 rounded-sm mb-2">
                {item.category}
              </span>
              <h3 className="text-xl md:text-2xl text-stone-300 font-serif leading-snug group-hover:text-stone-100 transition-colors cursor-pointer">
                {item.title}
              </h3>
              <p className="text-sm text-neutral-500 leading-7 font-light text-justify">
                {item.summary}
              </p>
            </div>
            <div className="mt-6 w-8 h-px bg-neutral-800 group-hover:w-full transition-all duration-700 ease-out"></div>
          </article>
        ))}
      </div>

      <div className="text-center pt-12 pb-24">
        <p className="text-neutral-700 text-xs tracking-widest">到底了。以前的事情就这些，未来还未发生。</p>
      </div>
    </div>
  );
}
