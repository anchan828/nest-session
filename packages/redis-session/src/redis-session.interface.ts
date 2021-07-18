import { ModuleMetadata, Type } from "@nestjs/common";
import * as expressSession from "express-session";
import { RedisOptions } from "ioredis";

export interface RedisSessionModuleOptions {
  session: expressSession.SessionOptions;
  redis?: RedisOptions;
}
export interface RedisSessionModuleAsyncOptions extends Pick<ModuleMetadata, "imports"> {
  useClass?: Type<RedisSessionModuleOptionsFactory>;
  useExisting?: Type<RedisSessionModuleOptionsFactory>;
  useFactory?: (...args: unknown[]) => Promise<RedisSessionModuleOptions> | RedisSessionModuleOptions;
  inject?: Array<Type<RedisSessionModuleOptionsFactory> | string | any>;
}

export interface RedisSessionModuleOptionsFactory {
  createRedisSessionModuleOptions(): Promise<RedisSessionModuleOptions> | RedisSessionModuleOptions;
}
