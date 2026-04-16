---
name: data-collector
description: 网页数据采集 skill，使用 Playwright 爬取网页并保存到 PostgreSQL 或 Redis。支持定时任务、手动触发、数据去重。
---

# Data Collector Skill

基于 Playwright 的网页数据采集工具，为下游系统提供市场情报数据。

## 项目结构

```
data-collector/
├── SKILL.md
├── scripts/
│   ├── collect.ts          # 采集主脚本
│   ├── parser.ts           # 数据解析器
│   └── validator.ts        # 数据验证
├── config/
│   └── sources.example.ts  # 数据源配置示例
└── references/
    └── storage-api.md      # 存储 API 文档
```

## Setup

```bash
# 安装依赖
npm install playwright @prisma/client ioredis
npm install -D prisma typescript ts-node

# 初始化数据库
npx prisma init
npx prisma migrate dev
```

## 配置数据源

在 `config/sources.ts` 中定义：

```typescript
export const sources = [
  {
    name: 'crypto-news',
    url: 'https://example.com/news',
    selector: '.news-item',
    schedule: '*/15 * * * *', // 每15分钟
    fields: {
      title: '.title',
      link: 'a@href',
      timestamp: '.date'
    }
  },
  {
    name: 'stock-price',
    url: 'https://example.com/stocks',
    schedule: '*/5 * * * *', // 每5分钟
    api: true // 使用 API 而非爬取
  }
];
```

## 运行采集

```bash
# 采集所有数据源
npm run collect

# 采集指定源
npm run collect -- --source=crypto-news

# 手动触发
npm run trigger -- crypto-news
```

## 数据输出

### PostgreSQL

```sql
CREATE TABLE collected_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL,
  title TEXT,
  content JSONB,
  url TEXT,
  collected_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_source ON collected_data(source);
CREATE INDEX idx_collected_at ON collected_data(collected_at);
```

### Redis

```typescript
// 最新数据
await redis.hset(`data:${source}:latest`, { title, content, url });

// 时间线数据
await redis.zadd(`data:${source}:timeline`, timestamp, JSON.stringify(data));

// 待处理队列
await redis.lpush('queue:pending', JSON.stringify({ source, data }));
```

## API 接口

| 端点 | 方法 | 说明 |
|------|------|------|
| `GET /api/sources` | 列出所有数据源 | - |
| `GET /api/data/:source` | 获取指定源数据 | 支持 `?since=timestamp` |
| `POST /api/trigger/:source` | 手动触发采集 | - |
| `GET /api/health` | 健康检查 | - |

## 常见问题

**Q: 被反爬了怎么办？**
- 使用 `--headless=false` 观察
- 添加随机延迟
- 启用 User-Agent 轮换

**Q: 数据格式不一致？**
- 在 parser.ts 中统一处理
- 使用 transform() 规范化

**Q: 采集失败如何处理？**
- 配置重试机制
- 记录错误到日志
- 发送告警通知
