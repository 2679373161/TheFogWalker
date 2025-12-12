// 客户端缓存工具 - 使用 localStorage 存储标签页内容

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number; // 毫秒
}

const CACHE_PREFIX = 'fogwalker_cache_';
const DEFAULT_EXPIRY = 60 * 60 * 1000; // 默认1小时

/**
 * 获取缓存键
 */
function getCacheKey(tabId: string): string {
  return `${CACHE_PREFIX}${tabId}`;
}

/**
 * 设置缓存
 */
export function setCache<T>(tabId: string, data: T, expiryMs: number = DEFAULT_EXPIRY): void {
  if (typeof window === 'undefined') {
    return; // 服务端不执行
  }

  try {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiry: expiryMs,
    };
    localStorage.setItem(getCacheKey(tabId), JSON.stringify(entry));
  } catch (error) {
    // localStorage 可能已满或不可用
    console.warn('Failed to set cache:', error);
  }
}

/**
 * 获取缓存
 */
export function getCache<T>(tabId: string): T | null {
  if (typeof window === 'undefined') {
    return null; // 服务端返回null
  }

  try {
    const item = localStorage.getItem(getCacheKey(tabId));
    if (!item) {
      return null;
    }

    const entry: CacheEntry<T> = JSON.parse(item);
    const age = Date.now() - entry.timestamp;

    // 检查是否过期
    if (age > entry.expiry) {
      localStorage.removeItem(getCacheKey(tabId));
      return null;
    }

    return entry.data;
  } catch (error) {
    console.warn('Failed to get cache:', error);
    return null;
  }
}

/**
 * 清除指定标签页的缓存
 */
export function clearCache(tabId: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.removeItem(getCacheKey(tabId));
  } catch (error) {
    console.warn('Failed to clear cache:', error);
  }
}

/**
 * 清除所有缓存
 */
export function clearAllCache(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(CACHE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.warn('Failed to clear all cache:', error);
  }
}

/**
 * 获取缓存信息（用于显示缓存状态）
 */
export function getCacheInfo(tabId: string): { exists: boolean; age: number; expiry: number } | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const item = localStorage.getItem(getCacheKey(tabId));
    if (!item) {
      return { exists: false, age: 0, expiry: 0 };
    }

    const entry: CacheEntry<any> = JSON.parse(item);
    const age = Date.now() - entry.timestamp;

    return {
      exists: age <= entry.expiry,
      age,
      expiry: entry.expiry,
    };
  } catch (error) {
    return null;
  }
}

