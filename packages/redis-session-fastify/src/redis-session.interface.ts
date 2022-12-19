import { FastifySessionOptions } from "@fastify/session";
import { ModuleMetadata, Type } from "@nestjs/common";
import * as ConnectRedis from "connect-redis";

export interface RedisSessionFastifyModuleOptions {
  redisClient?: ConnectRedis.Client;
  session: FastifySessionOptions;
}
export interface RedisSessionFastifyModuleAsyncOptions extends Pick<ModuleMetadata, "imports"> {
  useClass?: Type<RedisSessionFastifyModuleOptionsFactory>;
  useExisting?: Type<RedisSessionFastifyModuleOptionsFactory>;
  useFactory?: (...args: unknown[]) => Promise<RedisSessionFastifyModuleOptions> | RedisSessionFastifyModuleOptions;
  inject?: Array<Type<RedisSessionFastifyModuleOptionsFactory> | string | any>;
}

export interface RedisSessionFastifyModuleOptionsFactory {
  createRedisSessionFastifyModuleOptions():
    | Promise<RedisSessionFastifyModuleOptions>
    | RedisSessionFastifyModuleOptions;
}
