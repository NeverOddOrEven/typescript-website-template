FROM neveroddoreven/alpine-nodejs:8.9

ARG PORT=7000
ARG DEST="/webroot"

ENV PORT ${PORT}

COPY ./src ${DEST}

RUN chown -R node:node ${DEST} && chmod -R 755 ${DEST}

WORKDIR ${DEST}

USER node

RUN pwd  

RUN ls -lrta 

# Retry this a few times on failures (seems to resolve npm EAI_AGAIN error)
RUN make fetch-deps 1>/dev/null 2>/dev/null || make fetch-deps 1>/dev/null 2>/dev/null || make fetch-deps

# Make sure the tests pass
RUN make test

CMD [ "/usr/bin/make", "prod" ]
