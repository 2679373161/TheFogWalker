import { useState, useEffect } from 'react';
import { GitCompare } from 'lucide-react';
import { ColliderData } from '@/types/content';

export function OpinionCollider() {
  const [data, setData] = useState<ColliderData | null>(null);
  const [readLeft, setReadLeft] = useState(false);
  const [readRight, setReadRight] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/collider')
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

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-64 text-red-500">
        {error || '加载失败'}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <header className="border-b border-neutral-800 pb-4 mb-6">
        <h2 className="text-lg font-light text-stone-400 flex items-center gap-2">
          <GitCompare className="w-4 h-4" /> 观点对撞机
        </h2>
        <p className="text-xs text-neutral-600 mt-1">
          系统检测到您倾向于左侧观点，已强制为您匹配右侧异见。
        </p>
      </header>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-px bg-neutral-800 border border-neutral-800">
        {/* 左侧观点 */}
        <div
          onClick={() => setReadLeft(true)}
          className={`bg-neutral-900 p-6 cursor-pointer transition-colors duration-500 ${
            readLeft ? 'bg-neutral-900' : 'hover:bg-neutral-800'
          }`}
        >
          <div className="text-xs font-mono text-stone-600 mb-4 uppercase tracking-widest">Thesis A</div>
          <h3 className="text-xl text-stone-200 font-bold mb-4">{data.left.title}</h3>
          <p className="text-sm leading-7 text-stone-400">{data.left.content}</p>
          <div className={`mt-4 w-4 h-4 rounded-full border border-stone-700 flex items-center justify-center ${
            readLeft ? 'bg-stone-700' : ''
          }`}>
            {readLeft && <div className="w-2 h-2 bg-white rounded-full"></div>}
          </div>
        </div>

        {/* 右侧观点 */}
        <div
           onClick={() => setReadRight(true)}
           className={`bg-neutral-900 p-6 cursor-pointer transition-colors duration-500 ${
             readRight ? 'bg-neutral-900' : 'hover:bg-neutral-800'
           }`}
        >
          <div className="text-xs font-mono text-stone-600 mb-4 uppercase tracking-widest">Thesis B</div>
          <h3 className="text-xl text-stone-200 font-bold mb-4">{data.right.title}</h3>
          <p className="text-sm leading-7 text-stone-400">{data.right.content}</p>
          <div className={`mt-4 w-4 h-4 rounded-full border border-stone-700 flex items-center justify-center ${
            readRight ? 'bg-stone-700' : ''
          }`}>
            {readRight && <div className="w-2 h-2 bg-white rounded-full"></div>}
          </div>
        </div>
      </div>

      <div className="mt-8 text-center h-12">
        {readLeft && readRight ? (
          <button className="animate-in fade-in zoom-in duration-500 text-stone-300 border-b border-stone-500 pb-1 text-sm hover:text-white">
            缝合裂痕，继续探索
          </button>
        ) : (
          <p className="text-xs text-neutral-600 font-mono animate-pulse">
            [ 警告：必须阅读双方观点才能解除锁定 ]
          </p>
        )}
      </div>
    </div>
  );
}