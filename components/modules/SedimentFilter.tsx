import { useState, useEffect, useRef } from 'react';
import { Clock, RefreshCw } from 'lucide-react';
import { SedimentItem } from '@/types/content';
import { formatDate } from '@/lib/utils/dateFormatter';
import { getCache, setCache } from '@/lib/cache/clientCache';

const TAB_ID = 'sediment';

export function SedimentFilter() {
  const [data, setData] = useState<SedimentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cacheStatus, setCacheStatus] = useState<'cached' | 'fresh' | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const loadData = async (useStream: boolean = false, forceRefresh: boolean = false) => {
    // 检查缓存
    if (!forceRefresh) {
      const cached = getCache<SedimentItem[]>(TAB_ID);
      if (cached && cached.length > 0) {
        setData(cached);
        setLoading(false);
        setCacheStatus('cached');
        // 后台更新
        if (!useStream) {
          loadData(false, true);
        }
        return;
      }
    }

    setLoading(true);
    setUpdating(!forceRefresh && data.length > 0);
    setError(null);

    try {
      if (useStream) {
        // 流式响应
        abortControllerRef.current = new AbortController();
        const response = await fetch(`/api/sediment?stream=true`, {
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error('Failed to fetch');
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.trim()) {
                try {
                  const parsed = JSON.parse(line);
                  if (parsed.error) {
                    // 流式响应中的错误
                    setError(parsed.message || parsed.errorMessage || '加载失败');
                    setLoading(false);
                    setUpdating(false);
                    return;
                  } else if (parsed.chunk) {
                    // 流式更新 - 这里简化处理，实际可以逐步构建JSON
                    // 由于JSON流式解析复杂，这里先接收完整数据
                  } else if (parsed.done && parsed.data) {
                    setData(parsed.data);
                    setCache(TAB_ID, parsed.data);
                    setCacheStatus('fresh');
                    setLoading(false);
                    setUpdating(false);
                    return;
                  }
                } catch (e) {
                  // 忽略解析错误
                }
              }
            }
          }
        }
      } else {
        // 非流式响应
        abortControllerRef.current = new AbortController();
        const response = await fetch('/api/sediment', {
          signal: abortControllerRef.current.signal,
        });
        const result = await response.json();

        if (result.success) {
          setData(result.data);
          setCache(TAB_ID, result.data);
          setCacheStatus(result.source === 'cache' ? 'cached' : 'fresh');
        } else {
          // 使用服务器返回的友好错误消息
          setError(result.message || result.error || '无法获取内容');
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Failed to fetch:', err);
        // 错误信息会在 result.message 中，这里设置通用提示
        setError('加载失败');
      }
    } finally {
      setLoading(false);
      setUpdating(false);
    }
  };

  useEffect(() => {
    loadData(true); // 首次加载使用流式
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleRefresh = () => {
    loadData(true, true);
  };

  if (loading && data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-400"></div>
      </div>
    );
  }

  if (error && data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="text-center space-y-2">
          <p className="text-red-400 text-sm font-light">{error}</p>
          <p className="text-neutral-600 text-xs font-mono mt-4">
            提示：如果这是配置问题，请检查 .env 文件中的 AI_API_KEY 和 AI_API_BASE_URL
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 border border-neutral-700 text-xs text-neutral-500 hover:border-neutral-600 hover:text-neutral-400 transition-colors"
        >
          重试
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <header className="border-l-2 border-stone-800 pl-6 py-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-light text-stone-300 flex items-center gap-3">
              <Clock className="w-5 h-5 text-stone-600" />
              沉淀池
            </h2>
            <p className="text-xs text-neutral-500 mt-2 font-mono">
              过滤器状态：已拦截过去 7 天内的 14,203 条噪音。<br/>
              仅展示经受住时间冲刷的残留物。
            </p>
          </div>
          <div className="flex items-center gap-2">
            {cacheStatus === 'cached' && (
              <span className="text-xs text-neutral-600 font-mono">已缓存</span>
            )}
            {updating && (
              <span className="text-xs text-neutral-600 font-mono animate-pulse">更新中...</span>
            )}
            <button
              onClick={handleRefresh}
              disabled={updating}
              className="p-2 hover:bg-neutral-800 rounded transition-colors disabled:opacity-50"
              title="刷新内容"
            >
              <RefreshCw className={`w-4 h-4 text-neutral-500 ${updating ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      <div className="space-y-16">
        {data.map((item) => (
          <article key={item.id} className="group relative">
            <div className="absolute -left-10 top-1 text-xs font-mono text-neutral-700 -rotate-90 origin-right w-8">
              {formatDate(item.date)}
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
