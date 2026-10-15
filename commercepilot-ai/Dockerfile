FROM node:24-bookworm-slim
WORKDIR /app
COPY package*.json ./
COPY server/package.json ./server/package.json
COPY client/package.json ./client/package.json
RUN npm ci --omit=dev
COPY server ./server
USER node
EXPOSE 4000
CMD ["node", "server/src/server.js"]
