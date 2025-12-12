import { useState, useEffect, useRef } from 'react';
import { GitCompare, RefreshCw } from 'lucide-react';
import { ColliderData } from '@/types/content';
import { getCache, setCache } from '@/lib/cache/clientCache';

const TAB_ID = 'collider';

export function OpinionCollider() {
  const [data, setData] = useState<ColliderData | null>(null);
  const [streamingData, setStreamingData] = useState<Partial<ColliderData> | null>(null); // 流式数据
  const [isStreaming, setIsStreaming] = useState(false); // 是否正在流式接收
  const [readLeft, setReadLeft] = useState(false);
  const [readRight, setReadRight] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const loadContent = async (useStream: boolean = false, forceRefresh: boolean = false) => {
    // 检查缓存
    if (!forceRefresh) {
      const cached = getCache<ColliderData>(TAB_ID);
      if (cached) {
        setData(cached);
        setLoading(false);
        // 后台更新
        if (!useStream) {
          loadContent(false, true);
        }
        return;
      }
    }

    setLoading(true);
    setUpdating(!forceRefresh && data !== null);
    setError(null);
    setStreamingData(null); // 重置流式数据

    try {
      if (useStream) {
        setIsStreaming(true);
        setLoading(false); // 立即显示内容区域，开始流式显示
        abortControllerRef.current = new AbortController();
        const response = await fetch(`/api/collider?stream=true`, {
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error('Failed to fetch');
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let jsonBuffer = '';

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
                    // 累积 JSON 字符串
                    jsonBuffer += parsed.chunk;
                    // 尝试解析 JSON（一旦完整就立即显示）
                    try {
                      const cleaned = jsonBuffer.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
                      // 尝试解析，如果成功说明 JSON 已完整
                      const partialData = JSON.parse(cleaned);
                      if (partialData.left && partialData.right) {
                        // JSON 完整，立即显示
                        setStreamingData(partialData);
                      }
                    } catch {
                      // JSON 还不完整，继续累积，但可以显示加载状态
                    }
                  } else if (parsed.error) {
                    // 流式响应中的错误
                    setError(parsed.message || parsed.errorMessage || '加载失败');
                    setIsStreaming(false);
                    setLoading(false);
                    setUpdating(false);
                    return;
                  } else if (parsed.done && parsed.data) {
                    // 流式完成，设置完整数据
                    setData(parsed.data);
                    setStreamingData(null); // 清空流式数据
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
        const response = await fetch('/api/collider', {
          signal: abortControllerRef.current.signal,
        });
        const result = await response.json();

        if (result.success) {
          setData(result.data);
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
  if (loading && !streamingData && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-400"></div>
      </div>
    );
  }

  if (error || (!data && !loading)) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="text-center space-y-2">
          <p className="text-red-400 text-sm font-light">{error || '加载失败'}</p>
          <p className="text-neutral-600 text-xs font-mono mt-4">
            提示：如果这是配置问题，请检查 .env 文件中的 AI_API_KEY 和 AI_API_BASE_URL
          </p>
        </div>
        <button
          onClick={() => {
            loadContent(true, true);
            setReadLeft(false);
            setReadRight(false);
          }}
          className="px-4 py-2 border border-neutral-700 text-xs text-neutral-500 hover:border-neutral-600 hover:text-neutral-400 transition-colors"
        >
          重试
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <header className="border-b border-neutral-800 pb-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-light text-stone-400 flex items-center gap-2">
              <GitCompare className="w-4 h-4" /> 观点对撞机
            </h2>
            <p className="text-xs text-neutral-600 mt-1">
              系统检测到您倾向于左侧观点，已强制为您匹配右侧异见。
            </p>
          </div>
          <div className="flex items-center gap-2">
            {updating && (
              <span className="text-xs text-neutral-600 font-mono animate-pulse">更新中...</span>
            )}
            <button
              onClick={() => {
                loadContent(true, true);
                setReadLeft(false);
                setReadRight(false);
              }}
              disabled={updating}
              className="p-2 hover:bg-neutral-800 rounded transition-colors disabled:opacity-50"
              title="刷新内容"
            >
              <RefreshCw className={`w-4 h-4 text-neutral-500 ${updating ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
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
          <h3 className="text-xl text-stone-200 font-bold mb-4">
            {(streamingData?.left?.title || data?.left?.title) || ''}
            {isStreaming && !streamingData?.left?.title && (
              <span className="inline-block w-0.5 h-5 bg-stone-400 ml-1 animate-pulse align-middle">|</span>
            )}
          </h3>
          <p className="text-sm leading-7 text-stone-400">
            {(streamingData?.left?.content || data?.left?.content) || ''}
            {isStreaming && streamingData?.left?.title && !streamingData?.left?.content && (
              <span className="inline-block w-0.5 h-4 bg-stone-400 ml-1 animate-pulse align-middle">|</span>
            )}
          </p>
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
          <h3 className="text-xl text-stone-200 font-bold mb-4">
            {(streamingData?.right?.title || data?.right?.title) || ''}
            {isStreaming && !streamingData?.right?.title && (
              <span className="inline-block w-0.5 h-5 bg-stone-400 ml-1 animate-pulse align-middle">|</span>
            )}
          </h3>
          <p className="text-sm leading-7 text-stone-400">
            {(streamingData?.right?.content || data?.right?.content) || ''}
            {isStreaming && streamingData?.right?.title && !streamingData?.right?.content && (
              <span className="inline-block w-0.5 h-4 bg-stone-400 ml-1 animate-pulse align-middle">|</span>
            )}
          </p>
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