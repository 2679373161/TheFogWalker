import { NextRequest, NextResponse } from 'next/server';
import { callAI, callAIStream } from '../../../lib/ai/client';
import { labellessPrompt } from '../../../lib/ai/prompts';
import { cache, CACHE_KEYS, CACHE_EXPIRY } from '../../../lib/cache/content';

interface LabellessData {
  content: string;
  meta: {
    author: string;
    source: string;
    likes: number;
    comments: string;
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const streamMode = searchParams.get('stream') === 'true';

    // 检查缓存（非流式模式）
    if (!streamMode) {
      const cachedData = cache.get(CACHE_KEYS.LABELLESS);
      if (cachedData) {
        return NextResponse.json({
          success: true,
          data: cachedData,
          timestamp: new Date().toISOString(),
          source: 'cache',
        });
      }
    }

    // 生成随机元数据
    const authors = [
      '一位匿名程序员',
      '被辞退的算法工程师',
      '哲学系博士生',
      '前大厂产品经理',
      '独立研究者',
      '自由撰稿人'
    ];

    const sources = [
      '个人博客（已删除）',
      '小众论坛',
      '学术社区',
      '私人邮件组',
      '加密笔记'
    ];

    // 流式响应
    if (streamMode) {
      try {
        const encoder = new TextEncoder();
        // 添加随机话题角度和唯一标识，确保每次请求都不同
        const topics = [
          '技术与社会', '个人与集体', '传统与创新', '自由与责任', 
          '效率与公平', '理性与感性', '进步与保守', '理想与现实'
        ];
        const randomTopic = topics[Math.floor(Math.random() * topics.length)];
        const randomSeed = Math.random().toString(36).substring(7);
        const enhancedPrompt = `${labellessPrompt}\n\n特别要求：本次观点应围绕"${randomTopic}"这一主题展开，确保内容独特且与前次不同。唯一标识：${randomSeed}`;
        
        const stream = await callAIStream(enhancedPrompt, {
          jsonMode: false,
          maxTokens: 1500,
          temperature: 0.9, // 提高温度增加随机性
        });

        const readable = new ReadableStream({
          async start(controller) {
            let content = '';
            try {
              const reader = stream.getReader();
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = new TextDecoder().decode(value);
                content += chunk;
                controller.enqueue(encoder.encode(JSON.stringify({ chunk }) + '\n'));
              }

              const result: LabellessData = {
                content: content.trim(),
                meta: {
                  author: authors[Math.floor(Math.random() * authors.length)],
                  source: sources[Math.floor(Math.random() * sources.length)],
                  likes: Math.floor(Math.random() * 50) + 1,
                  comments: '无',
                },
              };

              cache.set(CACHE_KEYS.LABELLESS, result, CACHE_EXPIRY.LABELLESS);
              controller.enqueue(encoder.encode(JSON.stringify({ done: true, data: result }) + '\n'));
              controller.close();
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
              let userMessage = '无法获取去标签内容。';
              
              if (errorMessage.includes('Authentication failed') || errorMessage.includes('API key') || errorMessage.includes('401')) {
                userMessage = 'AI API 认证失败。请检查环境变量中的 AI_API_KEY 配置。';
              } else if (errorMessage.includes('timeout')) {
                userMessage = '请求超时。AI 响应时间过长，请稍后重试。';
              } else if (errorMessage.includes('Rate limit') || errorMessage.includes('429')) {
                userMessage = '请求频率过高。请稍等片刻后重试。';
              }
              
              controller.enqueue(encoder.encode(JSON.stringify({ 
                error: true, 
                message: userMessage,
                errorMessage: errorMessage 
              }) + '\n'));
              controller.close();
            }
          },
        });

        return new Response(readable, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        let userMessage = '无法获取去标签内容。';
        
        if (errorMessage.includes('Authentication failed') || errorMessage.includes('API key') || errorMessage.includes('401')) {
          userMessage = 'AI API 认证失败。请检查环境变量中的 AI_API_KEY 配置。';
        } else if (errorMessage.includes('timeout')) {
          userMessage = '请求超时。AI 响应时间过长，请稍后重试。';
        } else if (errorMessage.includes('Rate limit') || errorMessage.includes('429')) {
          userMessage = '请求频率过高。请稍等片刻后重试。';
        } else if (errorMessage.includes('not configured')) {
          userMessage = 'AI API 未配置。请检查环境变量 AI_API_KEY 和 AI_API_BASE_URL。';
        }
        
        return NextResponse.json(
          {
            success: false,
            error: errorMessage,
            message: userMessage,
            timestamp: new Date().toISOString(),
          },
          { status: 500 }
        );
      }
    }

    // 非流式响应
    const topics = [
      '技术与社会', '个人与集体', '传统与创新', '自由与责任', 
      '效率与公平', '理性与感性', '进步与保守', '理想与现实'
    ];
    const randomTopic = topics[Math.floor(Math.random() * topics.length)];
    const randomSeed = Math.random().toString(36).substring(7);
    const enhancedPrompt = `${labellessPrompt}\n\n特别要求：本次观点应围绕"${randomTopic}"这一主题展开，确保内容独特且与前次不同。唯一标识：${randomSeed}`;
    
    const content = await callAI(enhancedPrompt, {
      jsonMode: false,
      maxTokens: 1500,
      temperature: 0.9, // 提高温度增加随机性
    });

    const result: LabellessData = {
      content: content.trim(),
      meta: {
        author: authors[Math.floor(Math.random() * authors.length)],
        source: sources[Math.floor(Math.random() * sources.length)],
        likes: Math.floor(Math.random() * 50) + 1,
        comments: '无',
      },
    };

    cache.set(CACHE_KEYS.LABELLESS, result, CACHE_EXPIRY.LABELLESS);

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
      source: 'api',
    });
  } catch (error) {
    console.error('Error in labelless API:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    let userMessage = '无法获取去标签内容。';
    let errorType = 'unknown';
    
    if (errorMessage.includes('Authentication failed') || errorMessage.includes('API key') || errorMessage.includes('401')) {
      userMessage = 'AI API 认证失败。请检查环境变量中的 AI_API_KEY 配置。';
      errorType = 'auth';
    } else if (errorMessage.includes('timeout')) {
      userMessage = '请求超时。AI 响应时间过长，请稍后重试。';
      errorType = 'timeout';
    } else if (errorMessage.includes('Rate limit') || errorMessage.includes('429')) {
      userMessage = '请求频率过高。请稍等片刻后重试。';
      errorType = 'rate_limit';
    } else if (errorMessage.includes('not configured')) {
      userMessage = 'AI API 未配置。请检查环境变量 AI_API_KEY 和 AI_API_BASE_URL。';
      errorType = 'config';
    } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      userMessage = '网络连接失败。请检查网络连接后重试。';
      errorType = 'network';
    } else {
      userMessage = '获取去标签内容时发生错误。请稍后重试或检查服务器日志。';
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        message: userMessage,
        errorType: errorType,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
