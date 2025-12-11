// 内容类型定义

export interface SedimentItem {
  id: number | string;
  title: string;
  date: string;
  summary: string;
  category: string;
}

export interface WormholeContent {
  title: string;
  author: string;
  content: string;
  tag: string;
}

export interface LabellessContent {
  content: string;
  meta: {
    author: string;
    source: string;
    likes: number;
    comments: string;
  };
}

export interface ColliderData {
  left: {
    title: string;
    content: string;
  };
  right: {
    title: string;
    content: string;
  };
}

export interface AiConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
  timeout: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp?: string;
}
