FROM node:16.15.1 AS development
WORKDIR /app/server
COPY ./server/package*.json ./
RUN npm i
COPY . ./

FROM node:16.15.1 as builder 

RUN mkdir -p /home/node/app
WORKDIR /home/node/app
COPY ./server/package*.json /home/node/app/
RUN chown -R node:node /home/node/

USER node

RUN npm install
COPY --chown=node:node ./contract /home/node/app/contract
COPY --chown=node:node ./server /home/node/app
RUN cd contract && npm install

RUN npm run build
CMD [ "node", "dist/src/index.js" ]
