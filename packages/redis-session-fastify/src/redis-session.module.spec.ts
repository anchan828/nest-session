import { Controller, Get, Inject, Post, Provider, Session } from "@nestjs/common";
import { FastifyAdapter } from "@nestjs/platform-fastify";
import { Test } from "@nestjs/testing";
import IORedis from "ioredis";
import { createClient } from "redis";
import * as RedisMock from "redis-mock";
import * as request from "supertest";
import { RedisSessionFastifyModuleOptionsFactory } from "./redis-session.interface";
import { RedisSessionModule } from "./redis-session.module";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const IORedisMock = require("ioredis-mock");
describe.each([
  {
    createRedisClient: async () => {
      const client = createClient({ legacyMode: true });
      await client.connect();
      return client;
    },
    name: "redis",
  },
  {
    createRedisClient: async () => {
      return new IORedis();
    },
    name: "ioredis",
  },
  {
    createRedisClient: async () => {
      return RedisMock.createClient();
    },
    name: "redis-mock",
  },
  {
    createRedisClient: async () => {
      return new IORedisMock();
    },
    name: "ioredis-mock",
  },
])("RedisSessionModule: ($name)", ({ createRedisClient }) => {
  it("should be defined", () => {
    expect(RedisSessionModule).toBeDefined();
  });

  it("should compile (register)", async () => {
    const module = await Test.createTestingModule({
      imports: [
        RedisSessionModule.register({
          redisClient: await createRedisClient(),
          session: {
            saveUninitialized: false,
            secret: "da39a3ee5e6b4b0d3255bfef95601890afd80709",
          },
        }),
      ],
    }).compile();
    const app = module.createNestApplication(new FastifyAdapter());
    await app.init();
    await app.close();
  });

  it("should use session (register)", async () => {
    @Controller()
    class TestController {
      @Post("setSession")
      setSession(@Session() session: Record<string, any>): void {
        session.test = "ok";
      }

      @Get("getSession")
      getSession(@Session() session: Record<string, any>): string {
        return session.test;
      }
    }

    const module = await Test.createTestingModule({
      controllers: [TestController],
      imports: [
        RedisSessionModule.register({
          redisClient: await createRedisClient(),
          session: {
            cookie: {
              secure: false,
            },
            saveUninitialized: false,
            secret: "da39a3ee5e6b4b0d3255bfef95601890afd80709",
          },
        }),
      ],
    }).compile();

    const app = module.createNestApplication(new FastifyAdapter());
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
    let cookies = "";
    await request(app.getHttpServer())
      .post("/setSession")
      .expect(201)
      .then((res: any) => {
        cookies = res.headers["set-cookie"].pop().split(";")[0];
      });

    const req = request(app.getHttpServer()).get("/getSession");
    req.cookies = cookies;
    await req.expect("ok");
    await app.close();
  });

  it("should compile (registerAsync)", async () => {
    const module = await Test.createTestingModule({
      imports: [
        RedisSessionModule.registerAsync({
          useFactory: async () => ({
            redisClient: await createRedisClient(),
            session: {
              saveUninitialized: false,
              secret: "da39a3ee5e6b4b0d3255bfef95601890afd80709",
            },
          }),
        }),
      ],
    }).compile();
    const app = module.createNestApplication(new FastifyAdapter());
    await app.init();
    await app.close();
  });

  it("should use session (registerAsync)", async () => {
    @Controller()
    class TestController {
      @Post("setSession")
      setSession(@Session() session: Record<string, any>): void {
        session.test = "ok";
      }

      @Get("getSession")
      getSession(@Session() session: Record<string, any>): string {
        return session.test;
      }
    }

    class ConfigService implements RedisSessionFastifyModuleOptionsFactory {
      constructor(@Inject("REDIS_HOST") private REDIS_HOST: string) {}

      async createRedisSessionFastifyModuleOptions() {
        return {
          redisClient: await createRedisClient(),
          session: {
            cookie: {
              secure: false,
            },
            saveUninitialized: false,
            secret: "da39a3ee5e6b4b0d3255bfef95601890afd80709",
          },
        };
      }
    }
    const provider: Provider = { provide: "REDIS_HOST", useValue: process.env.REDIS_HOST || "localhost" };
    const module = await Test.createTestingModule({
      controllers: [TestController],
      imports: [
        RedisSessionModule.registerAsync({
          imports: [{ exports: [provider], module: class {}, providers: [provider] }],
          inject: ["REDIS_HOST"],
          useClass: ConfigService,
        }),
      ],
    }).compile();

    const app = module.createNestApplication(new FastifyAdapter());
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
    let cookies = "";
    await request(app.getHttpServer())
      .post("/setSession")
      .expect(201)
      .then((res: any) => {
        cookies = res.headers["set-cookie"].pop().split(";")[0];
      });

    const req = request(app.getHttpServer()).get("/getSession");
    req.cookies = cookies;
    await req.expect("ok");
    await app.close();
  });
});
