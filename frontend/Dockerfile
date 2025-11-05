FROM nginx:alpine

RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copio todo el frontend al docroot
COPY . /usr/share/nginx/html

# Puerto interno del nginx
EXPOSE 80
