import { NextRequest, NextResponse } from 'next/server';
import { callAI, callAIStream } from '../../../lib/ai/client';
import { wormholePrompt } from '../../../lib/ai/prompts';
import { cache, CACHE_KEYS, CACHE_EXPIRY } from '../../../lib/cache/content';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const streamMode = searchParams.get('stream') === 'true';

    // 流式响应
    if (streamMode) {
      try {
        const encoder = new TextEncoder();
        // 添加随机领域和唯一标识，确保每次请求都不同
        const domains = ['考古学', '哲学', '数学', '物理学', '生物学', '历史学', '人类学', '语言学', '心理学', '艺术理论'];
        const randomDomain = domains[Math.floor(Math.random() * domains.length)];
        const randomSeed = Math.random().toString(36).substring(7);
        const enhancedPrompt = `${wormholePrompt}\n\n特别要求：本次内容应聚焦于${randomDomain}领域，确保内容独特且与前次不同。唯一标识：${randomSeed}`;
        
        const stream = await callAIStream(enhancedPrompt, {
          jsonMode: true,
          maxTokens: 3000,
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
              parsedData._requestId = Math.random().toString(36).substr(2, 9);

              controller.enqueue(encoder.encode(JSON.stringify({ done: true, data: parsedData }) + '\n'));
              controller.close();
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
              let userMessage = '无法探索虫洞。';
              
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
        let userMessage = '无法探索虫洞。';
        
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
    const domains = ['考古学', '哲学', '数学', '物理学', '生物学', '历史学', '人类学', '语言学', '心理学', '艺术理论'];
    const randomDomain = domains[Math.floor(Math.random() * domains.length)];
    const randomSeed = Math.random().toString(36).substring(7);
    const enhancedPrompt = `${wormholePrompt}\n\n特别要求：本次内容应聚焦于${randomDomain}领域，确保内容独特且与前次不同。唯一标识：${randomSeed}`;
    
    const response = await callAI(enhancedPrompt, {
      jsonMode: true,
      maxTokens: 3000,
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

    parsedData._requestId = Math.random().toString(36).substr(2, 9);

    return NextResponse.json({
      success: true,
      data: parsedData,
      timestamp: new Date().toISOString(),
      source: 'api',
    });
  } catch (error) {
    console.error('Error in wormhole API:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    // 根据错误类型提供更友好的提示
    let userMessage = '无法探索虫洞。';
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
      userMessage = '探索虫洞时发生错误。请稍后重试或检查服务器日志。';
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
