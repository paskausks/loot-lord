FROM node:22-alpine

LABEL "org.opencontainers.image.source"="https://github.com/paskausks/loot-lord"

WORKDIR /app

COPY src ./src
COPY migrations ./migrations
COPY package.json .
COPY run.sh .
COPY knexfile.js .
COPY tsconfig.json .

RUN npm install
RUN npm run build
RUN chmod +x run.sh

ENTRYPOINT ["./run.sh"]
