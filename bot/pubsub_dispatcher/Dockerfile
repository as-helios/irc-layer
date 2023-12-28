FROM node:lts-bullseye-slim

RUN mkdir -p /usr/src/node-app
WORKDIR /usr/src/node-app

COPY package.json /usr/src/node-app

RUN npm install
COPY . /usr/src/node-app

CMD ["node", "app.js"]
#CMD ["tail", "-f", "/dev/null"]
#CMD ["npm","start"]