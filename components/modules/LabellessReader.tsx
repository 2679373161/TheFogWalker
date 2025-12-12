import { useState, useEffect, useRef } from 'react';
import { EyeOff, RefreshCw } from 'lucide-react';
import { LabellessContent } from '@/types/content';
import { getCache, setCache } from '@/lib/cache/clientCache';

const TAB_ID = 'labelless';

export function LabellessReader() {
  const [content, setContent] = useState<LabellessContent | null>(null);
  const [streamingContent, setStreamingContent] = useState<string>(''); // 流式内容
  const [isStreaming, setIsStreaming] = useState(false); // 是否正在流式接收
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const loadContent = async (useStream: boolean = false, forceRefresh: boolean = false) => {
    // 检查缓存
    if (!forceRefresh) {
      const cached = getCache<LabellessContent>(TAB_ID);
      if (cached) {
        setContent(cached);
        setLoading(false);
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
    setStreamingContent(''); // 重置流式内容

    try {
      if (useStream) {
        setIsStreaming(true);
        setLoading(false); // 立即显示内容区域，开始流式显示
        abortControllerRef.current = new AbortController();
        const response = await fetch(`/api/labelless?stream=true`, {
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error('Failed to fetch');
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let streamContent = '';

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
                  if (parsed.chunk) {
                    streamContent += parsed.chunk;
                    // 实时更新流式内容显示
                    setStreamingContent(streamContent);
                  } else if (parsed.error) {
                    // 流式响应中的错误
                    setError(parsed.message || parsed.errorMessage || '加载失败');
                    setIsStreaming(false);
                    setLoading(false);
                    setUpdating(false);
                    return;
                  } else if (parsed.done && parsed.data) {
                    // 流式完成，设置完整内容
                    setContent(parsed.data);
                    setStreamingContent(''); // 清空流式内容
                    setIsStreaming(false);
                    setCache(TAB_ID, parsed.data);
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
        const response = await fetch('/api/labelless', {
          signal: abortControllerRef.current.signal,
        });
        const result = await response.json();

        if (result.success) {
          setContent(result.data);
          setCache(TAB_ID, result.data);
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

  // 只在完全没有内容且不在流式接收时显示加载动画
  if (loading && !streamingContent && !content) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-400"></div>
      </div>
    );
  }

  if (error || (!content && !loading)) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="text-center space-y-2">
          <p className="text-red-400 text-sm font-light">{error || '加载失败'}</p>
          <p className="text-neutral-600 text-xs font-mono mt-4">
            提示：如果这是配置问题，请检查 .env 文件中的 AI_API_KEY 和 AI_API_BASE_URL
          </p>
        </div>
        <button
          onClick={() => loadContent(true, true)}
          className="px-4 py-2 border border-neutral-700 text-xs text-neutral-500 hover:border-neutral-600 hover:text-neutral-400 transition-colors"
        >
          重试
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="border-b border-neutral-800 pb-4 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-light text-stone-400 flex items-center gap-2">
              <EyeOff className="w-4 h-4" /> 去标签模式
            </h2>
            <p className="text-xs text-neutral-600 mt-1">
              已剥离：作者身份、发布时间、点赞数、评论区
            </p>
          </div>
          <div className="flex items-center gap-2">
            {updating && (
              <span className="text-xs text-neutral-600 font-mono animate-pulse">更新中...</span>
            )}
            <button
              onClick={() => loadContent(true, true)}
              disabled={updating}
              className="p-2 hover:bg-neutral-800 rounded transition-colors disabled:opacity-50"
              title="刷新内容"
            >
              <RefreshCw className={`w-4 h-4 text-neutral-500 ${updating ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      <div className="bg-neutral-900 p-2 md:p-8 rounded-sm min-h-[40vh] flex items-center">
        {loading && !streamingContent && content === null ? (
          <div className="flex items-center justify-center w-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-400"></div>
          </div>
        ) : (
          <p className="text-lg md:text-xl leading-9 text-stone-300 font-serif">
            {streamingContent || content?.content || ''}
            {isStreaming && (
              <span className="inline-block w-0.5 h-5 bg-stone-400 ml-1 animate-pulse align-middle">|</span>
            )}
          </p>
        )}
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