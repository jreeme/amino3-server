########################################
# build
########################################
FROM mhart/alpine-node:6.12.3 AS build

LABEL maintainer="john.d.reeme@keywcorp.com"

ENV ALPINE_VERSION=3.4.6
ENV NODE_ENV=development

# Install needed packages. Notes:
#   * dumb-init: a proper init system for containers, to reap zombie children
#   * musl: standard C library
#   * linux-headers: commonly needed, and an unusual package name from Alpine.
#   * build-base: used so we include the basic development packages (gcc)
#   * bash: so we can access /bin/bash
#   * git: to ease up clones of repos
#   * ca-certificates: for SSL verification during Pip and easy_install
#   * python: the binaries themselves
#   * python-dev: are used for gevent e.g.
#   * py-setuptools: required only in major version 2, installs easy_install so we can install Pip.
ENV PACKAGES="\
  wget \
  git \
  bash \
  dumb-init \
  musl \
  linux-headers \
  build-base \
  bash \
  git \
  ca-certificates \
  python2 \
  python2-dev \
  py-setuptools \
"

RUN npm install -g yarn
RUN apk update

  # replacing default repositories with edge ones
RUN echo "http://dl-cdn.alpinelinux.org/alpine/edge/testing" > /etc/apk/repositories && \
  echo "http://dl-cdn.alpinelinux.org/alpine/edge/community" >> /etc/apk/repositories && \
  echo "http://dl-cdn.alpinelinux.org/alpine/edge/main" >> /etc/apk/repositories

  # Add the packages, with a CDN-breakage fallback if needed
RUN apk add --no-cache $PACKAGES || (sed -i -e 's/dl-cdn/dl-4/g' /etc/apk/repositories && apk add --no-cache $PACKAGES)

  # turn back the clock -- so hacky!
RUN echo "http://dl-cdn.alpinelinux.org/alpine/v$ALPINE_VERSION/main/" > /etc/apk/repositories

  # make some useful symlinks that are expected to exist
RUN if [[ ! -e /usr/bin/python ]];        then ln -sf /usr/bin/python2.7 /usr/bin/python; fi && \
  if [[ ! -e /usr/bin/python-config ]]; then ln -sf /usr/bin/python2.7-config /usr/bin/python-config; fi && \
  if [[ ! -e /usr/bin/easy_install ]];  then ln -sf /usr/bin/easy_install-2.7 /usr/bin/easy_install; fi

  # Install and upgrade Pip
RUN easy_install pip && \
  pip install --upgrade pip && \
  if [[ ! -e /usr/bin/pip ]]; then ln -sf /usr/bin/pip2.7 /usr/bin/pip; fi

COPY . /src
WORKDIR /src

RUN yarn run build
#Set AMINO3_NO_LISTEN=TRUE and run server to pull and build client (use ARG so it doesn't wind up in image)
ARG AMINO3_NO_LISTEN=TRUE
RUN /usr/bin/node server/server.js && \
  find /src -name '*.map' -exec rm {} \; && \
  find /src -name '*.ts' -exec rm {} \; && \
  /usr/bin/npm prune --production

########################################
# production
########################################
FROM mhart/alpine-node:6.12.3 AS production
LABEL maintainer="john.d.reeme@keywcorp.com"

ENV ALPINE_VERSION=3.4.6
ENV NODE_ENV=production

# Install needed packages. Notes:
#   * dumb-init: a proper init system for containers, to reap zombie children
#   * bash: so we can access /bin/bash
ENV PACKAGES="\
  bash \
  dumb-init \
"
RUN echo "alias ll='ls -Fal'" >> /root/.bashrc && \
  echo "set -o vi" >> /root/.bashrc && \
  apk update && \
  # replacing default repositories with edge ones
  echo "http://dl-cdn.alpinelinux.org/alpine/edge/testing" > /etc/apk/repositories && \
  echo "http://dl-cdn.alpinelinux.org/alpine/edge/community" >> /etc/apk/repositories && \
  echo "http://dl-cdn.alpinelinux.org/alpine/edge/main" >> /etc/apk/repositories && \
  apk add --no-cache $PACKAGES || (sed -i -e 's/dl-cdn/dl-4/g' /etc/apk/repositories && apk add --no-cache $PACKAGES) && \
  echo "http://dl-cdn.alpinelinux.org/alpine/v$ALPINE_VERSION/main/" > /etc/apk/repositories

COPY --from=build /src/common /src/common/
COPY --from=build /src/dist /src/dist/
COPY --from=build /src/node_modules /src/node_modules/
COPY --from=build /src/server /src/server/
COPY --from=build /src/static /src/static/

EXPOSE 3000
ENV NODE_ENV=production
WORKDIR /src
ENTRYPOINT ["/usr/bin/dumb-init","--"]
CMD ["/usr/bin/node","/src/server/server.js"]

