FROM ghcr.io/nordeck/matrix-widget-toolkit/widget-server:1@sha256:77c23bd22699771e682dac9ec34e1a73c00728405bd77a160d2df22a7922800f

ADD build /usr/share/nginx/html/
ADD LICENSE /usr/share/nginx/html/LICENSE.txt
