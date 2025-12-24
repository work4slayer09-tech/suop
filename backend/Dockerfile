# Backend Dockerfile - Node 18 LTS
FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Install dependencies first (leverage docker cache)
COPY package.json package-lock.json ./
RUN npm ci --production

# Copy rest of the backend
COPY . .

# Ensure environment variables are provided at runtime:
#   - MONGO_URI
#   - JWT_SECRET
#   - PORT (optional)
ENV PORT=3000
EXPOSE 3000

CMD ["node", "server.js"]
