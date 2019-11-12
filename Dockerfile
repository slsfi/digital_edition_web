FROM node:10-alpine

RUN apk update
RUN apk add --no-cache g++ gcc libgcc libstdc++ linux-headers make python git

RUN git clone --depth 1 -b master https://github.com/slsfi/digital_edition_web.git

WORKDIR /digital_edition_web

COPY src/assets/i18n src/assets/i18n
COPY src/assets/fonts src/assets/fonts
COPY src/assets/images src/assets/images
COPY src/assets/custom_css src/assets/custom_css
COPY scripts scripts
COPY config config
COPY resources resources

RUN mkdir www

RUN npm install 
RUN npm install cheerio
RUN npm install rev-hash
RUN npm install -g ionic 
RUN npm i -g cordova 
RUN npm i -g native-run
RUN npm i -g @sentry/browser
RUN npm i --save @ionic-native/social-sharing     
RUN npm i --save leaflet 
RUN npm audit fix
RUN ionic cordova prepare --source-map
RUN ionic cordova platform rm browser --save 
RUN ionic cordova platform add browser@latest --save 
RUN ionic cordova plugin add cordova-plugin-x-socialsharing 
RUN ionic cordova build browser --prod --aot --webpack ./config/webpack.config.js
RUN node ./scripts/cache-busting.js