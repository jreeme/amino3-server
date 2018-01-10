FROM mhart/alpine-node:6.12.3 AS build

RUN npm install -g yarn
RUN apk update
#RUN apk add --virtual build-dependencies build-base gcc wget git
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

  # replacing default repositories with edge ones
RUN echo "http://dl-cdn.alpinelinux.org/alpine/edge/testing" > /etc/apk/repositories
RUN echo "http://dl-cdn.alpinelinux.org/alpine/edge/community" >> /etc/apk/repositories
RUN echo "http://dl-cdn.alpinelinux.org/alpine/edge/main" >> /etc/apk/repositories

  # Add the packages, with a CDN-breakage fallback if needed
RUN apk add --no-cache $PACKAGES || (sed -i -e 's/dl-cdn/dl-4/g' /etc/apk/repositories && apk add --no-cache $PACKAGES)

  # turn back the clock -- so hacky!
RUN echo "http://dl-cdn.alpinelinux.org/alpine/v$ALPINE_VERSION/main/" > /etc/apk/repositories

  # make some useful symlinks that are expected to exist
RUN if [[ ! -e /usr/bin/python ]];        then ln -sf /usr/bin/python2.7 /usr/bin/python; fi
RUN if [[ ! -e /usr/bin/python-config ]]; then ln -sf /usr/bin/python2.7-config /usr/bin/python-config; fi
RUN if [[ ! -e /usr/bin/easy_install ]];  then ln -sf /usr/bin/easy_install-2.7 /usr/bin/easy_install; fi

  # Install and upgrade Pip
RUN easy_install pip
RUN pip install --upgrade pip
RUN if [[ ! -e /usr/bin/pip ]]; then ln -sf /usr/bin/pip2.7 /usr/bin/pip; fi

COPY . /src
WORKDIR /src

RUN yarn run build
RUN /usr/bin/node server/server.js
#ENTRYPOINT ["/usr/bin/dumb-init","--"]
#CMD ["/usr/bin/node","server/server.js"]

# since we will be "always" mounting the volume, we can set this up
#ENTRYPOINT ["/usr/bin/dumb-init"]
#CMD ["python"]

#FROM alpine
#
#LABEL maintainer="john.d.reeme@keywcorp.com"
#
## Install Node and NPM
#RUN apk add --update nodejs nodejs-npm
#
## Copy app to /src
#COPY . /src
#
#WORKDIR /src
#
#RUN npm install -g yarn
#RUN yarn
#
#EXPOSE 3000
#
##ENTRYPOINT ["node", "./app.js"]
##ENTRYPOINT ["sh"]
