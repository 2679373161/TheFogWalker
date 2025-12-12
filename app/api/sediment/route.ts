import { NextRequest, NextResponse } from 'next/server';
import { callAI, callAIStream } from '../../../lib/ai/client';
import { sedimentPrompt } from '../../../lib/ai/prompts';
import { cache, CACHE_KEYS, CACHE_EXPIRY } from '../../../lib/cache/content';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const streamMode = searchParams.get('stream') === 'true';

    // 检查缓存（非流式模式）
    if (!streamMode) {
      const cachedData = cache.get(CACHE_KEYS.SEDIMENT);
      if (cachedData) {
        return NextResponse.json({
          success: true,
          data: cachedData,
          timestamp: new Date().toISOString(),
          source: 'cache',
        });
      }
    }

    // 流式响应
    if (streamMode) {
      try {
        const encoder = new TextEncoder();
        // 添加随机性和时间戳，确保每次请求都不同
        const randomSeed = Math.random().toString(36).substring(7);
        const timestamp = Date.now();
        const enhancedPrompt = `${sedimentPrompt}\n\n注意：请确保内容具有独特性和多样性，避免重复。本次请求的唯一标识：${randomSeed}-${timestamp}`;
        
        const stream = await callAIStream(enhancedPrompt, {
          jsonMode: true,
          maxTokens: 2000,
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
                
                // 尝试解析部分JSON
                try {
                  const cleaned = buffer.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
                  // 发送增量数据
                  controller.enqueue(encoder.encode(JSON.stringify({ chunk: new TextDecoder().decode(value) }) + '\n'));
                } catch {
                  // 继续累积
                }
              }

              // 解析完整JSON
              const cleanedResponse = buffer.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
              const parsedData = JSON.parse(cleanedResponse);
              
              if (!Array.isArray(parsedData)) {
                throw new Error('Expected array response but got: ' + typeof parsedData);
              }

              // 存储到缓存
              cache.set(CACHE_KEYS.SEDIMENT, parsedData, CACHE_EXPIRY.SEDIMENT);

              // 发送完成信号
              controller.enqueue(encoder.encode(JSON.stringify({ done: true, data: parsedData }) + '\n'));
              controller.close();
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
              let userMessage = '无法获取沉淀内容。';
              
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
        // 如果流式调用本身失败（如认证错误），返回JSON错误响应
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        let userMessage = '无法获取沉淀内容。';
        
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

    // 非流式响应（保持原有逻辑）
    const randomSeed = Math.random().toString(36).substring(7);
    const timestamp = Date.now();
    const enhancedPrompt = `${sedimentPrompt}\n\n注意：请确保内容具有独特性和多样性，避免重复。本次请求的唯一标识：${randomSeed}-${timestamp}`;
    
    const response = await callAI(enhancedPrompt, {
      jsonMode: true,
      maxTokens: 2000,
      temperature: 0.9, // 提高温度增加随机性
    });

    // 解析 JSON 响应
    let parsedData;
    try {
      const cleanedResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsedData = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('Failed to parse JSON response:', response);
      throw new Error('AI response is not valid JSON format');
    }

    // 验证数据结构
    if (!Array.isArray(parsedData)) {
      throw new Error('Expected array response but got: ' + typeof parsedData);
    }

    // 存储到缓存
    cache.set(CACHE_KEYS.SEDIMENT, parsedData, CACHE_EXPIRY.SEDIMENT);

    return NextResponse.json({
      success: true,
      data: parsedData,
      timestamp: new Date().toISOString(),
      source: 'api',
    });
  } catch (error) {
    console.error('Error in sediment API:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    // 根据错误类型提供更友好的提示
    let userMessage = '无法获取沉淀内容。';
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
      userMessage = '获取内容时发生错误。请稍后重试或检查服务器日志。';
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
