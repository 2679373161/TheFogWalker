import { NextRequest, NextResponse } from 'next/server';
import { callAI } from '../../../lib/ai/client';
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
    // 检查缓存
    const cachedData = cache.get(CACHE_KEYS.LABELLESS);
    if (cachedData) {
      return NextResponse.json({
        success: true,
        data: cachedData,
        timestamp: new Date().toISOString(),
        source: 'cache',
      });
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

    // 调用 AI API 获取内容
    const content = await callAI(labellessPrompt, {
      jsonMode: false,
      maxTokens: 1500,
      temperature: 0.8,
    });

    // 构建完整数据结构
    const result: LabellessData = {
      content: content.trim(),
      meta: {
        author: authors[Math.floor(Math.random() * authors.length)],
        source: sources[Math.floor(Math.random() * sources.length)],
        likes: Math.floor(Math.random() * 50) + 1,
        comments: '无',
      },
    };

    // 存储到缓存
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

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        message: '无法获取去标签内容。请检查 AI API 配置或稍后重试。',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
