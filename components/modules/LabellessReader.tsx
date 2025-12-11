import { useState, useEffect } from 'react';
import { EyeOff } from 'lucide-react';
import { LabellessContent } from '@/types/content';

export function LabellessReader() {
  const [content, setContent] = useState<LabellessContent | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/labelless')
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          setContent(result.data);
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

  if (error || !content) {
    return (
      <div className="flex items-center justify-center h-64 text-red-500">
        {error || '加载失败'}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="border-b border-neutral-800 pb-4 mb-8">
        <h2 className="text-lg font-light text-stone-400 flex items-center gap-2">
          <EyeOff className="w-4 h-4" /> 去标签模式
        </h2>
        <p className="text-xs text-neutral-600 mt-1">
          已剥离：作者身份、发布时间、点赞数、评论区
        </p>
      </header>

      <div className="bg-neutral-900 p-2 md:p-8 rounded-sm min-h-[40vh] flex items-center">
        <p className="text-lg md:text-xl leading-9 text-stone-300 font-serif">
          {content.content}
        </p>
      </div>

      <div className="relative border-t border-neutral-800 pt-8 mt-8">
        <div className={`transition-all duration-700 ${
          revealed ? 'blur-0 opacity-100' : 'blur-md opacity-30 select-none'
        }`}>
          <div className="grid grid-cols-2 gap-4 text-xs font-mono text-neutral-500">
            <div>作者: <span className="text-stone-400">{content.meta.author}</span></div>
            <div>来源: <span className="text-stone-400">{content.meta.source}</span></div>
            <div>热度: <span className="text-stone-400">{content.meta.likes} like</span></div>
            <div>评论: <span className="text-stone-400">{content.meta.comments}</span></div>
          </div>
          {revealed && (
            <p className="mt-4 text-xs text-stone-600 italic">
              * 既然你已经基于内容做出了判断，现在你可以看到这个观点的出身了。这改变你的想法了吗？
            </p>
          )}
        </div>

        {!revealed && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <button
              onClick={() => setRevealed(true)}
              className="bg-neutral-900 border border-neutral-700 text-stone-400 px-6 py-2 text-sm hover:border-stone-400 hover:text-stone-200 transition-colors"
            >
              我已独立思考完毕
            </button>
          </div>
        )}
      </div>
    </div>
  );
}