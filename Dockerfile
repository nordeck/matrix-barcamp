FROM ghcr.io/nordeck/matrix-widget-toolkit/widget-server:1@sha256:1cb5845a60176e8146a2fe8acde028a5a726f13bc3d4963feccfa581cc9ba62f

ADD build /usr/share/nginx/html/
ADD LICENSE /usr/share/nginx/html/LICENSE.txt
