FROM node:18-slim AS build

WORKDIR /usr/src/app
COPY package.json tsconfig.json ./
COPY src ./src

RUN yarn install
RUN yarn build

FROM gcr.io/distroless/nodejs:18
COPY --from=build /usr/src/app/dist/index.mjs /usr/src/app/index.mjs
COPY --from=build /usr/src/app/node_modules /usr/src/app/node_modules

WORKDIR /usr/src/app
CMD ["index.mjs"]
EXPOSE 6969
