FROM alpine

LABEL maintainer="john.d.reeme@keywcorp.com"

# Install Node and NPM
RUN apk add --update nodejs nodejs-npm

# Copy app to /src
COPY . /src

WORKDIR /src

RUN npm install -g yarn
RUN yarn

EXPOSE 3000

#ENTRYPOINT ["node", "./app.js"]
ENTRYPOINT ["sh"]
