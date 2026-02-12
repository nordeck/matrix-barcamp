FROM ghcr.io/nordeck/matrix-widget-toolkit/widget-server:1@sha256:4484168c740ecce8f6639d9d2c37b89077eae1a86555d59de4cfeef8a0a34b12

ADD build /usr/share/nginx/html/
ADD LICENSE /usr/share/nginx/html/LICENSE.txt
