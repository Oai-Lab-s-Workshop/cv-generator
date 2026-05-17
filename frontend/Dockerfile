# Stage 1: Build the Angular app
FROM node:22-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN mkdir -p src/assets && echo '{"bugReportUrl":""}' > src/assets/runtime-config.json
RUN node_modules/.bin/ng build --configuration production

# Stage 2: Serve via nginx
FROM nginx:alpine
COPY --from=build /app/dist/resumate /usr/share/nginx/html
COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 80
ENTRYPOINT ["/entrypoint.sh"]
