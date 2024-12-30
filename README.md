# Perpetual Drive API

An application that combines an interactive information board with an online storage drive for managing and sharing files.
Built with Express, Prisma, PostgreSQL, and TypeScript.

---

## Local Setup

### Prerequisites
1. Install [Node.js](https://nodejs.org/) (v20 or later).
2. Install [PostgreSQL](https://www.postgresql.org/).

### Steps
1. Clone the repository:
  ```
   git clone https://github.com/your-repo/perpetual-drive-api.git
   cd perpetual-drive-api
  ```
2. Install dependencies:
  ```
   npm install
  ```
3. Configure environment variables:
   Create a `.env` file in the root directory, copy and change the variables if needed:
  ```
   PORT=3001
   FRONTEND_DOMAIN="http://localhost:3000"
   NODE_ENV="dev"
   DATABASE_URL="postgresql://postgres:testpass123@localhost:6500/mydb?schema=public"
   ACCESS_TOKEN_SECRET="poop"
   REFRESH_TOKEN_SECRET="poop2"
   FILE_STORAGE_PATH="./storage"
  ```
4. Apply migrations:
  ```
   npx prisma migrate dev
  ```
5. Seed the database:
  ```
   npx ts-node prisma/seed.ts
  ```
6. Start the server:
  ```
   npm run dev
  ```
7. API is now running at http://localhost:3001.
