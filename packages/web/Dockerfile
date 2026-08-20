FROM node:20-alpine AS builder

WORKDIR /app

COPY packages/web/package.json packages/web/package-lock.json* packages/web/
COPY package.json package-lock.json ./
COPY packages/web/ packages/web/

RUN npm install --workspace=@devhub/web

WORKDIR /app/packages/web

ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/packages/web/dist /usr/share/nginx/html
COPY packages/web/nginx/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
