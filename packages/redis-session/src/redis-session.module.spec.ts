import { Controller, Get, Post, Session } from "@nestjs/common";
import { ExpressAdapter } from "@nestjs/platform-express";
import { Test } from "@nestjs/testing";
import * as request from "supertest";
import { RedisSessionModule } from "./redis-session.module";
describe("RedisSessionModule", () => {
  it("should be defined", () => {
    expect(RedisSessionModule).toBeDefined();
  });

  it("should compile", async () => {
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

  it("should use session", async () => {
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
});
