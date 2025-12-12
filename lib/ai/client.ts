import OpenAI from 'openai';
import { AiConfig } from '../../types/content';

export function createOpenAIClient(config: Partial<AiConfig> = {}): OpenAI {
  const baseUrl = config.baseUrl || process.env.AI_API_BASE_URL;
  const apiKey = config.apiKey || process.env.AI_API_KEY;
  const model = config.model || process.env.AI_MODEL || 'gpt-4-turbo-preview';
  const timeout = config.timeout || parseInt(process.env.APP_TIMEOUT || '30000');

  if (!apiKey) {
    throw new Error('AI API Key is not configured. Please set AI_API_KEY in your environment variables.');
  }

  if (!baseUrl) {
    throw new Error('AI API Base URL is not configured. Please set AI_API_BASE_URL in your environment variables.');
  }

  const client = new OpenAI({
    baseURL: baseUrl,
    apiKey: apiKey,
    timeout: timeout,
  });

  return client;
}

export async function callAI(
  prompt: string,
  options: {
    config?: Partial<AiConfig>;
    jsonMode?: boolean;
    maxTokens?: number;
    temperature?: number;
  } = {}
): Promise<string> {
  const client = createOpenAIClient(options.config);
  const model = options.config?.model || process.env.AI_MODEL || 'gpt-4-turbo-preview';

  try {
    const completion = await client.chat.completions.create({
      model: model,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant. Always respond in the requested format.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 2000,
      response_format: options.jsonMode ? { type: 'json_object' } : undefined,
    });

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No content received from AI API');
    }

    return content;
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        throw new Error('AI API request timed out. Please check your network connection or increase the timeout.');
      }
      if (error.message.includes('401')) {
        throw new Error('Authentication failed. Please check your API key.');
      }
      if (error.message.includes('429')) {
        throw new Error('Rate limit exceeded. Please wait a moment before retrying.');
      }
      throw new Error(`AI API error: ${error.message}`);
    }
    throw new Error('Unknown error occurred while calling AI API');
  }
}

/**
 * 流式调用AI API
 * @param prompt - 提示词
 * @param options - 配置选项
 * @returns ReadableStream 流
 */
export async function callAIStream(
  prompt: string,
  options: {
    config?: Partial<AiConfig>;
    jsonMode?: boolean;
    maxTokens?: number;
    temperature?: number;
  } = {}
): Promise<ReadableStream<Uint8Array>> {
  const client = createOpenAIClient(options.config);
  const model = options.config?.model || process.env.AI_MODEL || 'gpt-4-turbo-preview';

  try {
    const stream = await client.chat.completions.create({
      model: model,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant. Always respond in the requested format.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 2000,
      response_format: options.jsonMode ? { type: 'json_object' } : undefined,
      stream: true,
    });

    // 将 OpenAI 流转换为 ReadableStream
    const encoder = new TextEncoder();
    const readable = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              controller.enqueue(encoder.encode(content));
            }
          }
          controller.close();
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          controller.error(new Error(`Stream error: ${errorMessage}`));
        }
      },
    });

    return readable;
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        throw new Error('AI API request timed out. Please check your network connection or increase the timeout.');
      }
      if (error.message.includes('401')) {
        throw new Error('Authentication failed. Please check your API key.');
      }
      if (error.message.includes('429')) {
        throw new Error('Rate limit exceeded. Please wait a moment before retrying.');
      }
      throw new Error(`AI API error: ${error.message}`);
    }
    throw new Error('Unknown error occurred while calling AI API');
  }
}