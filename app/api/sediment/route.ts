import { NextRequest, NextResponse } from 'next/server';
import { callAI } from '../../../lib/ai/client';
import { sedimentPrompt } from '../../../lib/ai/prompts';
import { cache, CACHE_KEYS, CACHE_EXPIRY } from '../../../lib/cache/content';

export async function GET(request: NextRequest) {
  try {
    // 检查缓存
    const cachedData = cache.get(CACHE_KEYS.SEDIMENT);
    if (cachedData) {
      return NextResponse.json({
        success: true,
        data: cachedData,
        timestamp: new Date().toISOString(),
        source: 'cache',
      });
    }

    // 调用 AI API
    const response = await callAI(sedimentPrompt, {
      jsonMode: true,
      maxTokens: 2000,
      temperature: 0.7,
    });

    // 解析 JSON 响应
    let parsedData;
    try {
      // AI 可能会返回带有 ```json 标记的内容，需要清理
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

    // 友好的错误消息
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        message: '无法获取沉淀内容。请检查 AI API 配置或稍后重试。',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
