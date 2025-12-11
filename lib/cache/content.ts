// 内存缓存实现
// 生产环境建议使用 Redis

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number; // 毫秒
}

class MemoryCache {
  private cache: Map<string, CacheEntry<any>> = new Map();

  set<T>(key: string, data: T, expiryMs: number): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiry: expiryMs,
    };
    this.cache.set(key, entry);
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // 检查是否过期
    const age = Date.now() - entry.timestamp;
    if (age > entry.expiry) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

export const cache = new MemoryCache();

// 缓存键前缀
export const CACHE_KEYS = {
  SEDIMENT: 'sediment_content',
  WORMHOLE: 'wormhole_content',
  LABELLESS: 'labelless_content',
  COLLIDER: 'collider_content',
};

// 缓存过期时间（毫秒）
export const CACHE_EXPIRY = {
  SEDIMENT: 24 * 60 * 60 * 1000, // 24小时
  WORMHOLE: 30 * 60 * 1000,      // 30分钟
  LABELLESS: 60 * 60 * 1000,     // 1小时
  COLLIDER: 2 * 60 * 60 * 1000,  // 2小时
};
