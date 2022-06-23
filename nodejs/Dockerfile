FROM node:16.15.1 AS development

WORKDIR /app/nodejs

COPY package*.json ./
RUN ls -al
RUN npm install

COPY . .

RUN npm run build
CMD [ "node", "dist/index.js" ]
