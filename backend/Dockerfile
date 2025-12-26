FROM node:18-alpine AS build
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}
EXPOSE 3000
CMD ["node", "server.js"]
FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

# Runtime env (SAFE, SIMPLE, CORRECT)
ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "server.js"]
