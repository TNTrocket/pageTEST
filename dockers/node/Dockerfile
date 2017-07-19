FROM node:latest

VOLUME /usr/src/app
WORKDIR /usr/src/app

COPY entrypoint.sh /tmp/entrypoint.sh
RUN chmod +x /tmp/entrypoint.sh

CMD ["/tmp/entrypoint.sh"]
