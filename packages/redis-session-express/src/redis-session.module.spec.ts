import { Controller, Get, Inject, Post, Provider, Session } from "@nestjs/common";
import { ExpressAdapter } from "@nestjs/platform-express";
import { Test } from "@nestjs/testing";
import IORedis from "ioredis";
import { createClient } from "redis";
import * as request from "supertest";
import { RedisSessionModuleOptionsFactory } from "./redis-session.interface";
import { RedisSessionModule } from "./redis-session.module";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const IORedisMock = require("ioredis-mock");
describe.each([
  {
    createRedisClient: async () => {
      const client = createClient();
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
            resave: false,
            saveUninitialized: false,
            secret: "test",
          },
        }),
      ],
    }).compile();

    const app = module.createNestApplication(new ExpressAdapter());
    await app.init();
    await app.close();
  });

  it("should use session (register)", async () => {
    @Controller()
    class TestController {
      @Post("setSession")
      setSession(@Session() session: any): void {
        session.test = "ok";
      }

      @Get("getSession")
      getSession(@Session() session: any): string {
        return session.test;
      }
    }

    const module = await Test.createTestingModule({
      controllers: [TestController],
      imports: [
        RedisSessionModule.register({
          redisClient: await createRedisClient(),
          session: {
            resave: false,
            saveUninitialized: false,
            secret: "test",
          },
        }),
      ],
    }).compile();

    const app = module.createNestApplication(new ExpressAdapter());
    await app.init();
    let cookies = "";
    await request(app.getHttpServer())
      .post("/setSession")
      .expect(201)
      .then((res: any) => {
        cookies = res.headers["set-cookie"].pop().split(";")[0];
        return res;
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
              resave: false,
              saveUninitialized: false,
              secret: "test",
            },
          }),
        }),
      ],
    }).compile();

    const app = module.createNestApplication(new ExpressAdapter());
    await app.init();
    await app.close();
  });

  it("should use session (registerAsync)", async () => {
    @Controller()
    class TestController {
      @Post("setSession")
      setSession(@Session() session: any): void {
        session.test = "ok";
      }

      @Get("getSession")
      getSession(@Session() session: any): string {
        return session.test;
      }
    }

    class ConfigService implements RedisSessionModuleOptionsFactory {
      constructor(@Inject("REDIS_HOST") private REDIS_HOST: string) {}

      async createRedisSessionModuleOptions() {
        return {
          redisClient: await createRedisClient(),
          session: {
            cookie: {
              secure: false,
            },
            resave: false,
            saveUninitialized: false,
            secret: "da39a3ee5e6b4b0d3255bfef95601890afd80708",
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

    const app = module.createNestApplication(new ExpressAdapter());
    await app.init();
    let cookies = "";
    await request(app.getHttpServer())
      .post("/setSession")
      .expect(201)
      .then((res: any) => {
        cookies = res.headers["set-cookie"].pop().split(";")[0];
        return res;
      });

    const req = request(app.getHttpServer()).get("/getSession");
    req.cookies = cookies;
    await req.expect("ok");
    await app.close();
  });
});
