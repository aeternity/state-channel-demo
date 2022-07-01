FROM node:16.15.1 AS development  

WORKDIR /app/server

COPY package*.json ./
RUN ls -al
RUN npm install

COPY . .

RUN npm run build
CMD [ "node", "dist/index.js" ]
