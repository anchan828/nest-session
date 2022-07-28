# @anchan828/nest-redis-session-express

This module is for express.

## Install

```shell
npm i @anchan828/nest-redis-session-express
```

The redis package you use:

```shell
npm i redis
npm i ioredis
npm i redis-mock
```

## Usage

```typescript
import { RedisSessionModule } from "@anchan828/nest-redis-session-express";

// redis@v4
import { createClient } from "redis";
const redisClient = createClient({ legacyMode: true });
redisClient.connect().catch(console.error);

// redis@v3
import { createClient } from "redis";
const redisClient = createClient();

// ioredis
import Redis from "ioredis";
const redisClient = new Redis();

// redis-mock
import * as RedisMock from "redis-mock";
const redisClient = createClient();

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

## Trouble-shooting

If it doesn't work, please check the order of middleware.

https://github.com/nestjs/docs.nestjs.com/issues/1248#issuecomment-629400653

```ts
@Module({
  imports: [
    RedisSessionModule.register({
      redisClient,
      session: { resave: false, saveUninitialized: false, secret: "secret" },
    }),
    PassportModule.register({ session: true }),
    // Don't change the import order! ☚
    PassportInitializeModule,
  ],
})
export class PassportSessionModule {}

@Module({})
export class PassportInitializeModule implements NestModule {
  public async configure(consumer: MiddlewareConsumer): Promise<void> {
    consumer.apply(passport.initialize(), passport.session()).forRoutes({ method: RequestMethod.ALL, path: "*" });
  }
}
```
