FROM node:alpine

WORKDIR /usr/src/app

RUN npm install -g grunt-cli

COPY package*.json ./
RUN npm install

COPY . .
EXPOSE 8080

CMD [ "grunt", "dev" ]
