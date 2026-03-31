# Renter Monorepo

A full-stack monorepo application with client and server packages.

## Project Structure

- `/client` - Frontend application
- `/server` - Backend API server

## Getting Started

### Installation

```bash
npm install
```

### Development

Run both client and server in development mode:

```bash
npm run start:dev
```

Or run them individually:

```bash
npm run dev:server
npm run dev:client
```

## Environment Variables

### Server

- **MONGO_URI** - MongoDB connection string (e.g., `mongodb://localhost:27017/renter` or connection to MongoDB Atlas)
- **JWT_SECRET** - Secret key for JWT token signing (use a strong random string)
- **CLOUDINARY_CLOUD_NAME** - Cloudinary cloud name for image uploads
- **CLOUDINARY_API_KEY** - Cloudinary API key
- **CLOUDINARY_API_SECRET** - Cloudinary API secret
- **NODE_ENV** - Environment mode (`development`, `production`, `test`)
- **PORT** - Server port (default: 5000)
- **REDIS_URL** - Redis connection URL (e.g., `redis://localhost:6379`)

### Client

- **REACT_APP_API_URL** - Backend API base URL

## Notes

- Create `.env` files in both `/client` and `/server` directories with the required environment variables
- Ensure MongoDB and Redis are running before starting the server
- Use `concurrently` for running both services simultaneously during development
