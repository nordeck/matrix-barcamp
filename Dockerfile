FROM ghcr.io/nordeck/matrix-widget-toolkit/widget-server:1@sha256:55aa10d9adfb5ff8f72de7017d18a7230843bd8b056573c08a2429ad463c5564

ADD build /usr/share/nginx/html/
ADD LICENSE /usr/share/nginx/html/LICENSE.txt
