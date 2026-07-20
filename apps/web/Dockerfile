# Stage 1: Build the Angular app
FROM node:22-alpine AS build
WORKDIR /app/web

COPY apps/web/package*.json ./
RUN npm ci

COPY apps/web/ ./
COPY backend/pocketbase/pb_data/seed.json /app/pb_data/seed.json
RUN mkdir -p src/assets && echo '{"bugReportUrl":"","mcpPublicBaseUrl":""}' > src/assets/runtime-config.json

RUN npx ng build --configuration production 2>&1

# Stage 2: Serve via nginx
FROM nginx:alpine
COPY --from=build /app/web/dist/resumate/browser /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/templates/default.conf.template
COPY apps/web/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 80
ENTRYPOINT ["/entrypoint.sh"]
