FROM node:18-bullseye-slim

WORKDIR /app

RUN apt-get update && apt-get install -y ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN mkdir -p /app/uploads

EXPOSE 8080
CMD ["node", "src/app.js"]
