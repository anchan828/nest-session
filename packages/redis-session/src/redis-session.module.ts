import {
  ClassProvider,
  DynamicModule,
  FactoryProvider,
  Global,
  Inject,
  MiddlewareConsumer,
  Module,
  NestModule,
  OnModuleDestroy,
  Provider,
  RequestMethod,
  Type,
} from "@nestjs/common";
import * as ConnectRedis from "connect-redis";
import * as expressSession from "express-session";
import * as session from "express-session";
import { Redis as IORedis } from "ioredis";
import {
  RedisSessionModuleAsyncOptions,
  RedisSessionModuleOptions,
  RedisSessionModuleOptionsFactory,
} from "./redis-session.interface";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Redis = require("ioredis");
const RedisStore = ConnectRedis(session);

const REDIS_SESSION_OPTIONS = "REDIS_SESSION_OPTIONS";

@Global()
@Module({})
export class RedisSessionModule implements NestModule, OnModuleDestroy {
  constructor(@Inject(REDIS_SESSION_OPTIONS) private readonly options: RedisSessionModuleOptions) {}

  public onModuleDestroy(): void {
    const redisstore: any & { client: IORedis } = this.options.session.store;
    redisstore.client.disconnect();
  }

  public static register(options: RedisSessionModuleOptions): DynamicModule {
    return {
      module: RedisSessionModule,
      providers: [{ provide: REDIS_SESSION_OPTIONS, useValue: options }],
    };
  }

  public static registerAsync(options: RedisSessionModuleAsyncOptions): DynamicModule {
    return {
      imports: [...(options.imports || [])],
      module: RedisSessionModule,
      providers: [...createAsyncProviders(options)],
    };
  }

  public configure(consumer: MiddlewareConsumer): void {
    this.options.session.store = new RedisStore({ client: new Redis(this.options.redis) });
    const middleware = expressSession(this.options.session);
    consumer.apply(middleware).forRoutes({ method: RequestMethod.ALL, path: "*" });
  }
}

function createAsyncProviders(options: RedisSessionModuleAsyncOptions): Provider[] {
  const asyncOptionsProvider = createAsyncOptionsProvider(options);
  if (options.useExisting || options.useFactory) {
    return [asyncOptionsProvider];
  }

  const providers: Provider[] = [asyncOptionsProvider];

  if (options.useClass) {
    providers.push({
      provide: options.useClass,
      useClass: options.useClass,
    } as ClassProvider);
  }

  return providers;
}

function createAsyncOptionsProvider(options: RedisSessionModuleAsyncOptions): FactoryProvider {
  if (options.useFactory) {
    return {
      inject: options.inject || [],
      provide: REDIS_SESSION_OPTIONS,
      useFactory: options.useFactory,
    };
  }
  return {
    inject: [options.useClass || options.useExisting].filter(
      (x): x is Type<RedisSessionModuleOptionsFactory> => x !== undefined,
    ),
    provide: REDIS_SESSION_OPTIONS,
    useFactory: async (optionsFactory: RedisSessionModuleOptionsFactory): Promise<RedisSessionModuleOptions> => {
      return optionsFactory.createRedisSessionModuleOptions();
    },
  };
}
