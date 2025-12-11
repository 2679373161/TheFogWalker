import { NextRequest, NextResponse } from 'next/server';
import { callAI } from '../../../lib/ai/client';
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
];

export async function GET(request: NextRequest) {
  try {
    // 随机选择一个话题
    const topic = currentTopics[Math.floor(Math.random() * currentTopics.length)];

    // 检查缓存
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

    // 调用 AI API
    const response = await callAI(topic.prompt, {
      jsonMode: true,
      maxTokens: 2500,
      temperature: 0.8,
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

    // 添加到缓存
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

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        message: '无法获取对撞机内容。请检查 AI API 配置或稍后重试。',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }}
