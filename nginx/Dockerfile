FROM nginx:1.25-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Remove default config
RUN rm -f /etc/nginx/conf.d/default.conf.orig
EXPOSE 80 443
