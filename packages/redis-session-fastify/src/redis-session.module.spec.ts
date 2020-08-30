import { Controller, Get, Post, Session } from "@nestjs/common";
import { FastifyAdapter } from "@nestjs/platform-fastify";
import { Test } from "@nestjs/testing";
import { Session as FastifySession } from "fastify";
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

  it("should use session", async () => {
    @Controller()
    class TestController {
      @Post("setSession")
      setSession(@Session() session: FastifySession): void {
        session.test = "ok";
      }

      @Get("getSession")
      getSession(@Session() session: FastifySession): string {
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
});
