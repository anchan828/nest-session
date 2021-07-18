import { Controller, Get, Inject, Post, Provider, Session } from "@nestjs/common";
import { ExpressAdapter } from "@nestjs/platform-express";
import { Test } from "@nestjs/testing";
import * as request from "supertest";
import { RedisSessionModuleOptionsFactory } from "./redis-session.interface";
import { RedisSessionModule } from "./redis-session.module";
describe("RedisSessionModule", () => {
  it("should be defined", () => {
    expect(RedisSessionModule).toBeDefined();
  });

  it("should compile (register)", async () => {
    const module = await Test.createTestingModule({
      imports: [
        RedisSessionModule.register({
          redis: {
            host: "localhost",
          },
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
          redis: {
            host: process.env.REDIS_HOST || "localhost",
          },
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
          useFactory: () => ({
            redis: {
              host: "localhost",
            },
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

      createRedisSessionModuleOptions() {
        return {
          redis: {
            host: this.REDIS_HOST,
          },
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