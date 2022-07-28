import { ModuleMetadata, Type } from "@nestjs/common";
import * as ConnectRedis from "connect-redis";
import * as expressSession from "express-session";

export interface RedisSessionModuleOptions {
  session: expressSession.SessionOptions;
  redisClient?: ConnectRedis.Client;
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
