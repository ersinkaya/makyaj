# 1. Aşama: Derleme (Build)
FROM node:20-alpine AS builder

WORKDIR /app

# Bağımlılıkları kopyala ve kur
COPY package*.json ./
RUN npm install

# Proje dosyalarını kopyala ve web sürümünü derle
COPY . .
RUN npx expo export --platform web

# 2. Aşama: Yayınlama (Serve)
FROM nginx:alpine

# Derlenen dosyaları Nginx HTML dizinine kopyala
COPY --from=builder /app/dist /usr/share/nginx/html

# Özel Nginx konfigürasyonunu kopyala
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
