# Stage 1: Build the Angular app
FROM node:22-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN mkdir -p src/assets && echo '{"bugReportUrl":""}' > src/assets/runtime-config.json

# angular.json references "input": "../pb_data" for the seed.json asset.
# That path is outside the Docker build context, so provide a stub.
RUN mkdir -p /pb_data && echo '{}' > /pb_data/seed.json

RUN npx ng build --configuration production 2>&1

# Stage 2: Serve via nginx
FROM nginx:alpine
COPY --from=build /app/dist/resumate/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 80
ENTRYPOINT ["/entrypoint.sh"]
