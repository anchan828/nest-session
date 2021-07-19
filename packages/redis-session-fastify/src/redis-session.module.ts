/* eslint-disable @typescript-eslint/no-var-requires */
import {
  ClassProvider,
  DynamicModule,
  FactoryProvider,
  Global,
  Inject,
  Module,
  NestModule,
  OnModuleDestroy,
  Provider,
  Type,
} from "@nestjs/common";
import { HttpAdapterHost } from "@nestjs/core";
import * as ConnectRedis from "connect-redis";
import { FastifyInstance } from "fastify";
import { Redis as IORedis } from "ioredis";
import {
  RedisSessionFastifyModuleAsyncOptions,
  RedisSessionFastifyModuleOptions,
  RedisSessionFastifyModuleOptionsFactory,
} from "./redis-session.interface";
const fastifySession = require("fastify-session");
const fastifyCookie = require("fastify-cookie");
const Redis = require("ioredis");
const RedisStore = ConnectRedis(fastifySession);
const REDIS_SESSION_FASTIFY_MODULE = "REDIS_SESSION_FASTIFY_MODULE" as const;

@Global()
@Module({})
export class RedisSessionModule implements NestModule, OnModuleDestroy {
  public static register(options: RedisSessionFastifyModuleOptions): DynamicModule {
    return {
      module: RedisSessionModule,
      providers: [
        {
          provide: REDIS_SESSION_FASTIFY_MODULE,
          useValue: options,
        },
      ],
    };
  }

  public static registerAsync(options: RedisSessionFastifyModuleAsyncOptions): DynamicModule {
    return {
      imports: [...(options.imports || [])],
      module: RedisSessionModule,
      providers: [...createAsyncProviders(options)],
    };
  }

  constructor(
    @Inject(REDIS_SESSION_FASTIFY_MODULE) private readonly options: RedisSessionFastifyModuleOptions,
    private readonly adapterHost: HttpAdapterHost,
  ) {}

  public onModuleDestroy(): void {
    const redisstore: any & { client: IORedis } = this.options.session.store;
    redisstore.client.disconnect();
  }

  public configure(): void {
    const fastifyInstance = this.adapterHost?.httpAdapter?.getInstance() as FastifyInstance;
    if (!fastifyInstance) {
      return;
    }

    this.options.session.store = new RedisStore({ client: new Redis(this.options.redis) });
    fastifyInstance.register(fastifyCookie);
    fastifyInstance.register(fastifySession, this.options.session);
  }
}

function createAsyncProviders(options: RedisSessionFastifyModuleAsyncOptions): Provider[] {
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

function createAsyncOptionsProvider(options: RedisSessionFastifyModuleAsyncOptions): FactoryProvider {
  if (options.useFactory) {
    return {
      inject: options.inject || [],
      provide: REDIS_SESSION_FASTIFY_MODULE,
      useFactory: options.useFactory,
    };
  }
  return {
    inject: [options.useClass || options.useExisting].filter(
      (x): x is Type<RedisSessionFastifyModuleOptionsFactory> => x !== undefined,
    ),
    provide: REDIS_SESSION_FASTIFY_MODULE,
    useFactory: async (
      optionsFactory: RedisSessionFastifyModuleOptionsFactory,
    ): Promise<RedisSessionFastifyModuleOptions> => {
      return optionsFactory.createRedisSessionFastifyModuleOptions();
    },
  };
}
