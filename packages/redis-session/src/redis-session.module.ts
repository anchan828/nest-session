import {
  DynamicModule,
  Global,
  Inject,
  MiddlewareConsumer,
  Module,
  NestModule,
  OnModuleDestroy,
  RequestMethod,
} from "@nestjs/common";
import * as ConnectRedis from "connect-redis";
import * as expressSession from "express-session";
import * as session from "express-session";
import { Redis as IORedis, RedisOptions } from "ioredis";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Redis = require("ioredis");
const RedisStore = ConnectRedis(session);

const REDIS_SESSION_OPTIONS = "REDIS_SESSION_OPTIONS";

export interface RedisSessionOptions {
  session: expressSession.SessionOptions;
  redis?: RedisOptions;
}

@Global()
@Module({})
export class RedisSessionModule implements NestModule, OnModuleDestroy {
  constructor(@Inject(REDIS_SESSION_OPTIONS) private readonly options: RedisSessionOptions) {}

  public onModuleDestroy(): void {
    const redisstore: any & { client: IORedis } = this.options.session.store;
    redisstore.client.disconnect();
  }

  public static register(options: RedisSessionOptions): DynamicModule {
    options.session.store = new RedisStore({ client: new Redis(options.redis) });
    return {
      module: RedisSessionModule,
      providers: [{ provide: REDIS_SESSION_OPTIONS, useValue: options }],
    };
  }

  public configure(consumer: MiddlewareConsumer): void {
    const middleware = expressSession(this.options.session);
    consumer.apply(middleware).forRoutes({ method: RequestMethod.ALL, path: "*" });
  }
}
