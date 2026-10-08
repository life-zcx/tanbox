FROM node:20-alpine AS builder

WORKDIR /app

COPY frontend-lk/package*.json ./
RUN npm install

COPY frontend-lk/ .
COPY shared/ /shared

RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY frontend-lk/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3001

CMD ["nginx", "-g", "daemon off;"]
