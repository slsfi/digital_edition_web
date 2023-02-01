FROM node:18-alpine

RUN apk update
RUN apk add --no-cache g++ gcc libgcc libstdc++ linux-headers make py3-pip git

RUN git clone --depth 1 -b angular-15 https://github.com/slsfi/digital_edition_web.git

WORKDIR /digital_edition_web

COPY src/assets/i18n src/assets/i18n
COPY src/assets/fonts src/assets/fonts
COPY src/assets/images src/assets/images
COPY src/assets/custom_css src/assets/custom_css
COPY scripts scripts

RUN mkdir www

RUN npm install
RUN npm install cheerio
RUN npm install rev-hash@3.0.0
RUN npm i -g @sentry/browser
RUN npm run build:prod
RUN node ./scripts/cache-busting.js
