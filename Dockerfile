FROM node:16-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
# Ensure the video file is included
COPY assets/kms.mov ./assets/
CMD [ "npm", "start" ]
