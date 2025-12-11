import { NextRequest, NextResponse } from 'next/server';
import { callAI } from '../../../lib/ai/client';
import { wormholePrompt } from '../../../lib/ai/prompts';
import { cache, CACHE_KEYS, CACHE_EXPIRY } from '../../../lib/cache/content';

export async function GET(request: NextRequest) {
  try {
    // 为每次请求生成唯一的缓存键（不按缓存虫洞内容）
    // 虫洞内容应该每次都不同

    // 调用 AI API
    const response = await callAI(wormholePrompt, {
      jsonMode: true,
      maxTokens: 3000,
      temperature: 0.8, // 更高的随机性
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

    // 添加到随机性：内容不会完全重复
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

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        message: '无法探索虫洞。请检查 AI API 配置或稍后重试。',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
