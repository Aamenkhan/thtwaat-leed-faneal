FROM node:20-alpine

WORKDIR /app

COPY package.json ./
COPY backend/package.json ./backend/package.json

RUN npm install --omit=dev && npm install --prefix backend --omit=dev

COPY backend ./backend
COPY api ./api

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/health || exit 1

CMD ["node", "backend/src/server.js"]
