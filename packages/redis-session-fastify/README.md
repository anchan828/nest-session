# @anchan828/nest-redis-session-fastify

This module is for fastify.

## Install

```shell
npm i @anchan828/nest-redis-session-fastify
```

The redis package you use:

```shell
npm i redis
npm i ioredis
npm i redis-mock
```

## Usage

```typescript
import { RedisSessionModule } from "@anchan828/nest-redis-session-fastify";

// redis@v4
import { createClient } from "redis";
const redisClient = createClient({ legacyMode: true });
redisClient.connect().catch(console.error);

// redis@v3
import { createClient } from "redis";
const redisClient = createClient();

// ioredis
import IORedis from "ioredis";
const redisClient = new IORedis();

// redis-mock
import { createClient } from "redis-mock";
const redisClient = createClient();

// ioredis-mock
const IORedisMock = require("ioredis-mock");
const redisClient = new IORedisMock();

@Module({
  imports: [
    RedisSessionModule.register({
      redisClient,
      session: {
        secret: "a secret with minimum length of 32 characters",
        saveUninitialized: false,
      },
    }),
  ],
})
export class AppModule {}
```
