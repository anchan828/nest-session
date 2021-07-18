# @anchan828/nest-redis-session-express

This module is for express.

## Install

```shell
npm i @anchan828/nest-redis-session-express
```

## Usage

```typescript
import { RedisSessionModule } from "@anchan828/nest-redis-session-express";

@Module({
  imports: [
    RedisSessionModule.register({
      session: {
        secret: "secret",
        saveUninitialized: false,
        resave: false,
      },
      redis: {
        host: "localhost",
      },
    }),
  ],
})
export class AppModule {}
```
