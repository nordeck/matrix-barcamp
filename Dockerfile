FROM ghcr.io/nordeck/matrix-widget-toolkit/widget-server:1

ADD build /usr/share/nginx/html/
ADD LICENSE /usr/share/nginx/html/LICENSE.txt
