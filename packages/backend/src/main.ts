import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { RequestMethod, ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.enableShutdownHooks();

  app.setGlobalPrefix("api", {
    exclude: [
      { path: "hook", method: RequestMethod.ALL },
      { path: "hook/(.*)", method: RequestMethod.ALL },
    ],
  });

  // 全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // 启用 CORS（生产环境建议显式配置 CORS_ORIGIN）
  const nodeEnv = configService.get<string>("NODE_ENV") ?? "development";
  const isProd = nodeEnv === "production";
  const corsOriginRaw =
    configService.get<string>("CORS_ORIGIN") ?? configService.get<string>("CORS_ORIGINS");
  const corsOrigins = (corsOriginRaw ?? "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
  const allowAllOrigins = corsOrigins.includes("*") || (!isProd && corsOrigins.length === 0);
  const corsOriginSet = new Set(corsOrigins.filter((v) => v !== "*"));

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowAllOrigins) return callback(null, true);
      return callback(null, corsOriginSet.has(origin));
    },
  });

  // Swagger 文档
  const config = new DocumentBuilder()
    .setTitle("Webhook Manager API")
    .setDescription("Webhook 管理系统 API 文档")
    .setVersion("1.0")
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document);

  const portRaw = process.env.PORT ?? "3000";
  const port = Number.parseInt(portRaw, 10);
  const finalPort = Number.isNaN(port) ? 3000 : port;

  await app.listen(finalPort);
  console.log(`🚀 Server running on http://localhost:${finalPort}`);
  console.log(`📚 API Docs: http://localhost:${finalPort}/api/docs`);
}
bootstrap();
