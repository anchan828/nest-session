/* eslint-disable @typescript-eslint/no-var-requires */
import { DynamicModule, Global, Inject, Module, NestModule } from "@nestjs/common";
import { DiscoveryModule, DiscoveryService } from "@nestjs/core";
import * as ConnectRedis from "connect-redis";
import { FastifyInstance } from "fastify";
import FastifySessionPlugin from "fastify-session";
import { RedisOptions } from "ioredis";
const fastifySession = require("fastify-session");
const fastifyCookie = require("fastify-cookie");
const Redis = require("ioredis");
const RedisStore = ConnectRedis(fastifySession);
const REDIS_SESSION_FASTIFY_MODULE = "REDIS_SESSION_FASTIFY_MODULE" as const;
type RedisSessionFastifyOptions = { redis?: RedisOptions; session: FastifySessionPlugin.Options };
@Global()
@Module({
  imports: [DiscoveryModule],
})
export class RedisSessionModule implements NestModule {
  public static register(options: RedisSessionFastifyOptions): DynamicModule {
    options.session.store = new RedisStore({ client: new Redis(options.redis) });
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

  constructor(
    @Inject(REDIS_SESSION_FASTIFY_MODULE) private readonly options: RedisSessionFastifyOptions,
    private readonly discovery: DiscoveryService,
  ) {}

  public configure(): void {
    const adapterHost = this.discovery.getProviders().find((p) => p.name === "HttpAdapterHost");

    const fastifyInstance = adapterHost?.instance?.httpAdapter?.getInstance() as FastifyInstance;
    if (!fastifyInstance) {
      return;
    }

    fastifyInstance.register(fastifyCookie);
    fastifyInstance.register(fastifySession, this.options.session);
  }
}
