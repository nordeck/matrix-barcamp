FROM ghcr.io/nordeck/matrix-widget-toolkit/widget-server:1@sha256:67caa0811f39a4a34514e40c935ebd472ef0b3a8eb826dbe4a7300152959f0ce

ADD build /usr/share/nginx/html/
ADD LICENSE /usr/share/nginx/html/LICENSE.txt
