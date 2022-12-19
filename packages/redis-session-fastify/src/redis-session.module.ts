/* eslint-disable @typescript-eslint/no-var-requires */
import * as fastifyCookie from "@fastify/cookie";
import * as fastifySession from "@fastify/session";
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
import {
  RedisSessionFastifyModuleAsyncOptions,
  RedisSessionFastifyModuleOptions,
  RedisSessionFastifyModuleOptionsFactory,
} from "./redis-session.interface";

const RedisStore = ConnectRedis(fastifySession as any);
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

  public async onModuleDestroy(): Promise<void> {
    if (!(this.options.redisClient && this.options.redisClient.disconnect)) {
      return;
    }

    await this.options.redisClient.disconnect();
  }

  public configure(): void {
    const fastifyInstance = this.adapterHost?.httpAdapter?.getInstance() as FastifyInstance;
    if (!fastifyInstance) {
      return;
    }

    fastifyInstance.register(fastifyCookie as any);
    fastifyInstance.register(fastifySession as any, {
      ...this.options.session,
      store: new RedisStore({ client: this.options.redisClient }) as unknown as fastifySession.SessionStore,
    });
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
