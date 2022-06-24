FROM node:16.15.1 AS development
WORKDIR /app/vuejs
COPY package.json package-lock.json ./
RUN npm install
COPY . ./
