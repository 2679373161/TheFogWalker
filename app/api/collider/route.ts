import { NextRequest, NextResponse } from 'next/server';
import { callAI, callAIStream } from '../../../lib/ai/client';
import { colliderPrompt } from '../../../lib/ai/prompts';
import { cache, CACHE_KEYS, CACHE_EXPIRY } from '../../../lib/cache/content';

let currentTopics = [
  {
    topic: '技术加速主义 vs 技术刹车论',
    prompt: colliderPrompt,
  },
  {
    topic: '全球化 vs 本土化',
    prompt: '你是一个观点对撞生成器。请为一个给定话题生成两个完全对立的立场。\n\n话题：全球化 vs 本土化\n\n要求：\n返回一个 JSON 对象，包含左右两个观点：\n{\n  "left": {\n    "title": "观点标题",\n    "content": "500-800字的论述"\n  },\n  "right": {\n    "title": "观点标题",\n    "content": "500-800字的论述"\n  }\n}\n\n确保两个观点：\n1. 逻辑自洽，论证充分\n2. 价值观和预设前提完全不同\n3. 能够真实反映社会中存在的分歧',
  },
  {
    topic: '个人主义 vs 集体主义',
    prompt: '你是一个观点对撞生成器。请为一个给定话题生成两个完全对立的立场。\n\n话题：个人主义 vs 集体主义\n\n要求：\n返回一个 JSON 对象，包含左右两个观点：\n{\n  "left": {\n    "title": "观点标题",\n    "content": "500-800字的论述"\n  },\n  "right": {\n    "title": "观点标题",\n    "content": "500-800字的论述"\n  }\n}\n\n确保两个观点：\n1. 逻辑自洽，论证充分\n2. 价值观和预设前提完全不同\n3. 能够真实反映社会中存在的分歧',
  },
  {
    topic: '效率优先 vs 公平优先',
    prompt: '你是一个观点对撞生成器。请为一个给定话题生成两个完全对立的立场。\n\n话题：效率优先 vs 公平优先\n\n要求：\n返回一个 JSON 对象，包含左右两个观点：\n{\n  "left": {\n    "title": "观点标题",\n    "content": "500-800字的论述"\n  },\n  "right": {\n    "title": "观点标题",\n    "content": "500-800字的论述"\n  }\n}\n\n确保两个观点：\n1. 逻辑自洽，论证充分\n2. 价值观和预设前提完全不同\n3. 能够真实反映社会中存在的分歧',
  },
  {
    topic: '理性主义 vs 经验主义',
    prompt: '你是一个观点对撞生成器。请为一个给定话题生成两个完全对立的立场。\n\n话题：理性主义 vs 经验主义\n\n要求：\n返回一个 JSON 对象，包含左右两个观点：\n{\n  "left": {\n    "title": "观点标题",\n    "content": "500-800字的论述"\n  },\n  "right": {\n    "title": "观点标题",\n    "content": "500-800字的论述"\n  }\n}\n\n确保两个观点：\n1. 逻辑自洽，论证充分\n2. 价值观和预设前提完全不同\n3. 能够真实反映社会中存在的分歧',
  },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const streamMode = searchParams.get('stream') === 'true';

    // 随机选择一个话题
    const topic = currentTopics[Math.floor(Math.random() * currentTopics.length)];

    // 检查缓存（非流式模式）
    if (!streamMode) {
      const cachedData = cache.get(`${CACHE_KEYS.COLLIDER}_${topic.topic}`);
      if (cachedData) {
        return NextResponse.json({
          success: true,
          data: cachedData,
          topic: topic.topic,
          timestamp: new Date().toISOString(),
          source: 'cache',
        });
      }
    }

    // 流式响应
    if (streamMode) {
      try {
        const encoder = new TextEncoder();
        // 添加唯一标识和随机角度，确保每次请求都不同
        const randomSeed = Math.random().toString(36).substring(7);
        const timestamp = Date.now();
        const angles = ['从历史角度', '从未来视角', '从个体层面', '从社会层面', '从经济角度', '从文化角度'];
        const randomAngle = angles[Math.floor(Math.random() * angles.length)];
        const enhancedPrompt = `${topic.prompt}\n\n特别要求：请${randomAngle}分析这个话题，确保观点独特且与前次不同。唯一标识：${randomSeed}-${timestamp}`;
        
        const stream = await callAIStream(enhancedPrompt, {
          jsonMode: true,
          maxTokens: 2500,
          temperature: 0.9, // 提高温度增加随机性
        });

        const readable = new ReadableStream({
          async start(controller) {
            let buffer = '';
            try {
              const reader = stream.getReader();
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += new TextDecoder().decode(value);
                controller.enqueue(encoder.encode(JSON.stringify({ chunk: new TextDecoder().decode(value) }) + '\n'));
              }

              const cleanedResponse = buffer.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
              const parsedData = JSON.parse(cleanedResponse);

              cache.set(`${CACHE_KEYS.COLLIDER}_${topic.topic}`, parsedData, CACHE_EXPIRY.COLLIDER);
              controller.enqueue(encoder.encode(JSON.stringify({ done: true, data: parsedData, topic: topic.topic }) + '\n'));
              controller.close();
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
              let userMessage = '无法获取对撞机内容。';
              
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
        let userMessage = '无法获取对撞机内容。';
        
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
    const randomSeed = Math.random().toString(36).substring(7);
    const timestamp = Date.now();
    const angles = ['从历史角度', '从未来视角', '从个体层面', '从社会层面', '从经济角度', '从文化角度'];
    const randomAngle = angles[Math.floor(Math.random() * angles.length)];
    const enhancedPrompt = `${topic.prompt}\n\n特别要求：请${randomAngle}分析这个话题，确保观点独特且与前次不同。唯一标识：${randomSeed}-${timestamp}`;
    
    const response = await callAI(enhancedPrompt, {
      jsonMode: true,
      maxTokens: 2500,
      temperature: 0.9, // 提高温度增加随机性
    });

    let parsedData;
    try {
      const cleanedResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsedData = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('Failed to parse JSON response:', response);
      throw new Error('AI response is not valid JSON format');
    }

    cache.set(`${CACHE_KEYS.COLLIDER}_${topic.topic}`, parsedData, CACHE_EXPIRY.COLLIDER);

    return NextResponse.json({
      success: true,
      data: parsedData,
      topic: topic.topic,
      timestamp: new Date().toISOString(),
      source: 'api',
    });
  } catch (error) {
    console.error('Error in collider API:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    let userMessage = '无法获取对撞机内容。';
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
      userMessage = '获取对撞机内容时发生错误。请稍后重试或检查服务器日志。';
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
