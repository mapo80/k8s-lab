# Stage 1: build dell'app con Node. npm ci installa esattamente il package-lock.
FROM node:22-alpine AS build
WORKDIR /build
# prima le dipendenze da sole: finché package*.json non cambia, restano nella cache di Docker
COPY package.json package-lock.json ./
RUN npm ci
COPY index.html vite.config.js ./
COPY public ./public
COPY src ./src
RUN npm run build

# Stage 2: nginx serve i file statici e fa da proxy verso il backend
FROM nginx:1.29-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /build/dist /usr/share/nginx/html
EXPOSE 80
