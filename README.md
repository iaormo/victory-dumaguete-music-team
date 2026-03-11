# Victory Dumaguete Music Team

A full-stack Progressive Web App for scheduling and managing church music team services.

## Author

**Ian James Ormo**

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS 4, Framer Motion
- **Backend**: Express.js, Prisma ORM
- **Database**: PostgreSQL
- **Cache**: Redis
- **Storage**: MinIO (S3-compatible)
- **Deploy**: Railway, Docker

## Getting Started

### Prerequisites

- Node.js 20+
- Docker & Docker Compose (for local services)

### Local Development

```bash
# Start PostgreSQL, Redis, MinIO
docker compose up -d

# Install dependencies
npm install

# Generate Prisma client and push schema
npx prisma generate
npx prisma db push

# Seed the database
npx tsx prisma/seed.ts

# Start dev servers
npm run dev
```

### Default Login

- **Email**: admin@victorydumaguete.com
- **Password**: victory2024

## Deployment (Railway)

1. Push to GitHub
2. Connect to Railway
3. Add PostgreSQL and Redis services
4. Set environment variables from `.env.example`
5. Deploy

## License

Private - All rights reserved.
