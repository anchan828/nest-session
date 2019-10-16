import { DynamicModule, Global, Module } from "@nestjs/common";
import * as ConnectRedis from "connect-redis";
import * as session from "express-session";
import { RedisOptions } from "ioredis";
import { NestSessionOptions, SessionModule } from "nestjs-session";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Redis = require("ioredis");
const RedisStore = ConnectRedis(session);

@Global()
@Module({})
export class RedisSessionModule {
  public static register(options: NestSessionOptions & { redis?: RedisOptions }): DynamicModule {
    options.session.store = new RedisStore({ client: new Redis(options.redis) });
    return {
      imports: [SessionModule.forRoot(options)],
      module: RedisSessionModule,
    };
  }
}
