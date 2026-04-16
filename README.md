# SourceMesh

A Playwright CLI based data collection hub that provides reusable market intelligence for downstream systems like TradingP and SignalReactor.

## Features

- 🎯 **Centralized scraping** - Manage multiple data sources in one place
- 🔄 **Scheduled collection** - Cron-based automatic data fetching
- 💾 **Multi-storage support** - PostgreSQL, Redis, or in-memory storage
- 🔧 **Extensible collectors** - Easy to add new data sources
- 📊 **REST API** - Query collected data programmatically
- ⚡ **TypeScript** - Full type safety

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your database and Redis settings
```

### 3. Add a data source

Edit `src/config.ts`:

```typescript
export const sources: DataSource[] = [
  {
    name: 'my-source',
    url: 'https://example.com/data',
    enabled: true,
    schedule: '*/15 * * * *', // Every 15 minutes
    selector: '.item',
    fields: {
      title: '.title',
      link: 'a@href',
    },
  },
];
```

### 4. Run collection

```bash
# List all sources
npm run list

# Collect all enabled sources
npm run collect:all

# Collect specific source
npm run collect -- my-source

# Manual trigger
npm run trigger -- my-source

# Check status
npm run status
```

## Project Structure

```
SourceMesh/
├── src/
│   ├── index.ts        # Main entry point
│   ├── cli.ts          # CLI commands
│   ├── config.ts       # Data source configuration
│   ├── types.ts        # TypeScript types
│   ├── collector.ts    # Data collection logic
│   ├── scraper.ts      # Playwright scraper
│   ├── scheduler.ts    # Cron scheduler
│   ├── storage.ts      # Storage adapters
│   └── logger.ts       # Logging utility
├── prisma/
│   ├── schema.prisma   # Database schema
│   └── seed.ts         # Seed script
└── .env.example        # Environment template
```

## CLI Commands

| Command | Description |
|---------|-------------|
| `npm run list` | List all configured sources |
| `npm run collect -- <name>` | Collect from specific source |
| `npm run collect:all` | Collect from all enabled sources |
| `npm run trigger -- <name>` | Manually trigger collection |
| `npm run status` | Show system status |
| `npm run dev` | Run in development mode |

## Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed initial data
npm run db:seed
```

## Data Storage

### PostgreSQL

Data is stored in the `CollectedData` table:

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| source | VARCHAR | Source name |
| type | VARCHAR | Data type |
| content | JSONB | Collected data |
| collectedAt | TIMESTAMP | When data was collected |
| createdAt | TIMESTAMP | Record creation time |

### Redis

- `queue:pending` - Pending data queue (List)
- `data:{source}:latest` - Latest data per source (Hash)
- `timeline:{source}` - Timeline data (Sorted Set)

## API (Coming Soon)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/sources` | GET | List all sources |
| `/api/data/:source` | GET | Get data from source |
| `/api/trigger/:source` | POST | Trigger collection |

## License

MIT
