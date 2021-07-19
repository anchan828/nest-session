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

## Trouble-shooting

If it doesn't work, please check the order of middleware.

https://github.com/nestjs/docs.nestjs.com/issues/1248#issuecomment-629400653

```ts
@Module({
  imports: [
    RedisSessionModule.register({
      redis: { host: "host" },
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
