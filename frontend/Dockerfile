# ==============================================================================
# AYIS Frontend Dockerfile — Lightweight Alpine Nginx Server
# ==============================================================================
FROM nginx:alpine

# Remove default nginx website
RUN rm -rf /usr/share/nginx/html/*

# Copy frontend static files (HTML5, CSS, JS, Assets)
COPY frontend/ /usr/share/nginx/html/

# Copy custom Nginx configuration with reverse proxy support
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
