import { ModuleMetadata, Type } from "@nestjs/common";
import FastifySessionPlugin from "fastify-session";
import { RedisOptions } from "ioredis";

export interface RedisSessionFastifyModuleOptions {
  redis?: RedisOptions;
  session: FastifySessionPlugin.Options;
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
