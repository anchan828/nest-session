# @anchan828/nest-redis-session

This module is for express.

## Install

```shell
npm i @anchan828/nest-redis-session
```

## Usage

```typescript
import { RedisSessionModule } from "@anchan828/nest-redis-session";

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
