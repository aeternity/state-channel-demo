FROM node:16.15.1 as builder 

RUN mkdir -p /home/node/app
WORKDIR /home/node/app
COPY package*.json /home/node/app/
RUN chown -R node:node /home/node/

USER node

RUN npm ci
COPY . .

COPY --chown=node:node . /home/node/app
RUN npm run build
CMD [ "node", "dist/src/index.js" ]
