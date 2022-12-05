FROM node:16.15.1 as builder 


RUN mkdir -p /home/node/app/server
WORKDIR /home/node/app/server
COPY ./server/package*.json /home/node/app/server/
RUN chown -R node:node /home/node/

USER node

COPY --chown=node:node ./contract /home/node/app/contract
COPY --chown=node:node ./server /home/node/app/server
RUN cd ../contract && npm install
RUN cd ../server && npm ci

RUN npm run build

ARG NODE_ENV
CMD [ "node", "dist/src/index.js" ]
