FROM node:20-alpine

WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY app.js .

ENV PORT=4000 \
    DATA_FILE=/data/todos.json

RUN mkdir /data && chown node:node /data
USER node

EXPOSE 4000
VOLUME /data

HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget -qO- http://localhost:4000/health || exit 1

CMD ["node", "app.js"]
