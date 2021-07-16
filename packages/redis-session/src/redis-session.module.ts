import { DynamicModule, Global, Inject, Module, OnModuleDestroy } from "@nestjs/common";
import * as ConnectRedis from "connect-redis";
import * as session from "express-session";
import { Redis as IORedis, RedisOptions } from "ioredis";
import { NestSessionOptions, SessionModule } from "nestjs-session";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Redis = require("ioredis");
const RedisStore = ConnectRedis(session);

const REDIS_SESSION_OPTIONS = "REDIS_SESSION_OPTIONS";

@Global()
@Module({})
export class RedisSessionModule implements OnModuleDestroy {
  constructor(@Inject(REDIS_SESSION_OPTIONS) private readonly options: NestSessionOptions) {}

  public onModuleDestroy(): void {
    const redisstore: any & { client: IORedis } = this.options.session.store;
    redisstore.client.disconnect();
  }

  public static register(options: NestSessionOptions & { redis?: RedisOptions }): DynamicModule {
    options.session.store = new RedisStore({ client: new Redis(options.redis) });
    return {
      imports: [SessionModule.forRoot(options)],
      module: RedisSessionModule,
      providers: [{ provide: REDIS_SESSION_OPTIONS, useValue: options }],
    };
  }
}
