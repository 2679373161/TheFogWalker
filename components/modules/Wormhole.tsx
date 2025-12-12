import { useState, useEffect, useRef } from 'react';
import { Shuffle, Wind, Lock, RefreshCw } from 'lucide-react';
import { WormholeContent } from '@/types/content';
import { getCache, setCache } from '@/lib/cache/clientCache';

const TAB_ID = 'wormhole';

export function Wormhole() {
  const [content, setContent] = useState<WormholeContent | null>(null);
  const [timer, setTimer] = useState(30);
  const [canLeave, setCanLeave] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wormholeId] = useState(() => Math.floor(Math.random() * 10000)); // 只在首次渲染时生成一次
  const abortControllerRef = useRef<AbortController | null>(null);

  const loadContent = async (useStream: boolean = false, forceRefresh: boolean = false) => {
    // 检查缓存
    if (!forceRefresh) {
      const cached = getCache<WormholeContent>(TAB_ID);
      if (cached) {
        setContent(cached);
        setLoading(false);
        setTimer(30);
        setCanLeave(false);
        // 后台更新
        if (!useStream) {
          loadContent(false, true);
        }
        return;
      }
    }

    setLoading(true);
    setUpdating(!forceRefresh && content !== null);
    setError(null);

    try {
      if (useStream) {
        abortControllerRef.current = new AbortController();
        const response = await fetch(`/api/wormhole?stream=true`, {
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
                    // 流式更新处理
                  } else if (parsed.done && parsed.data) {
                    setContent(parsed.data);
                    setCache(TAB_ID, parsed.data);
                    setTimer(30);
                    setCanLeave(false);
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
        abortControllerRef.current = new AbortController();
        const response = await fetch('/api/wormhole', {
          signal: abortControllerRef.current.signal,
        });
        const result = await response.json();

        if (result.success) {
          setContent(result.data);
          setCache(TAB_ID, result.data);
          setTimer(30);
          setCanLeave(false);
        } else {
          // 使用服务器返回的友好错误消息
          setError(result.message || result.error || '无法获取内容');
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Failed to fetch:', err);
        setError('加载失败');
      }
    } finally {
      setLoading(false);
      setUpdating(false);
    }
  };

  useEffect(() => {
    loadContent(true);
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
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

  if (error || (!content && !loading)) {
    return (
      <div className="flex flex-col min-h-[70vh] justify-center space-y-4">
        <div className="text-center space-y-2">
          <p className="text-red-400 text-sm font-light">{error || '加载失败'}</p>
          <p className="text-neutral-600 text-xs font-mono mt-4">
            提示：如果这是配置问题，请检查 .env 文件中的 AI_API_KEY 和 AI_API_BASE_URL
          </p>
        </div>
        <div className="flex justify-center">
          <button
            onClick={() => loadContent(true, true)}
            className="px-4 py-2 border border-neutral-700 text-xs text-neutral-500 hover:border-neutral-600 hover:text-neutral-400 transition-colors"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[70vh] justify-between">
      <header className="flex justify-between items-start border-b border-neutral-800 pb-4 mb-8">
        <h2 className="text-lg font-light text-stone-400 flex items-center gap-2">
          <Shuffle className="w-4 h-4" /> 虫洞 #{wormholeId}
        </h2>
        <div className="flex items-center gap-2">
          <div className="text-xs font-mono text-neutral-600">
            来源: 未知节点
          </div>
          {updating && (
            <span className="text-xs text-neutral-600 font-mono animate-pulse">更新中...</span>
          )}
          <button
            onClick={() => loadContent(true, true)}
            disabled={updating || !canLeave}
            className="p-2 hover:bg-neutral-800 rounded transition-colors disabled:opacity-50"
            title="刷新内容"
          >
            <RefreshCw className={`w-4 h-4 text-neutral-500 ${updating ? 'animate-spin' : ''}`} />
          </button>
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
          onClick={() => loadContent(true, true)}
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
