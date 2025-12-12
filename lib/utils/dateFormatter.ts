// 日期格式化工具 - 支持中文友好的日期显示

/**
 * 格式化日期为中文友好的格式（用于侧边显示，更简洁）
 * @param dateStr - 日期字符串，格式为 "YYYY-MM-DD"
 * @returns 格式化后的日期字符串
 */
export function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr + 'T00:00:00');
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    const diffTime = today.getTime() - targetDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    // 今天
    if (diffDays === 0) {
      return '今天';
    }
    
    // 昨天
    if (diffDays === 1) {
      return '昨天';
    }
    
    // 一周内显示相对时间
    if (diffDays > 1 && diffDays <= 7) {
      return `${diffDays}天前`;
    }
    
    // 一个月内显示"X周前"
    if (diffDays > 7 && diffDays <= 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks}周前`;
    }
    
    // 今年：只显示月日，使用简洁格式
    if (year === now.getFullYear()) {
      return `${month}/${day}`;
    }
    
    // 去年及更早：显示年份后两位和月日
    return `${year.toString().slice(-2)}/${month}/${day}`;
  } catch (error) {
    // 如果解析失败，返回原始字符串
    console.error('Date parsing error:', error);
    return dateStr;
  }
}

/**
 * 获取日期的简短格式（用于紧凑显示）
 * @param dateStr - 日期字符串，格式为 "YYYY-MM-DD"
 * @returns 简短格式日期字符串
 */
export function formatDateShort(dateStr: string): string {
  try {
    const date = new Date(dateStr + 'T00:00:00');
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    const diffTime = today.getTime() - targetDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // 今天
    if (diffDays === 0) {
      return '今天';
    }
    
    // 昨天
    if (diffDays === 1) {
      return '昨天';
    }
    
    // 一周内
    if (diffDays > 1 && diffDays <= 7) {
      return `${diffDays}天前`;
    }
    
    // 超过一周显示月日
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}/${day}`;
  } catch (error) {
    console.error('Date parsing error:', error);
    return dateStr;
  }
}

