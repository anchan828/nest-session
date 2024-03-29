# @anchan828/nest-session

Sample: https://codesandbox.io/s/anchan828-nest-redis-session-express-sample-cne6w0?file=/src/app.module.ts

```ts
import { RedisSessionModule } from "@anchan828/nest-redis-session-express";
// or
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
        secret: "secret",
        saveUninitialized: false,
        resave: false,
      },
    }),
  ],
})
export class AppModule {}
```
