# @anchan828/nest-redis-session-fastify

This module is for fastify.

## Install

```shell
npm i @anchan828/nest-redis-session-fastify
```

## Usage

```typescript
import { RedisSessionModule } from "@anchan828/nest-redis-session-fastify";

@Module({
  imports: [
    RedisSessionModule.register({
      session: {
        secret: "a secret with minimum length of 32 characters",
        saveUninitialized: false,
      },
      redis: {
        host: "localhost",
      },
    }),
  ],
})
export class AppModule {}
```
