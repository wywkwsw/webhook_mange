import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "./auth/auth.module";
import { HookModule } from "./hook/hook.module";
import { UserModule } from "./user/user.module";
import { WebhookModule } from "./webhook/webhook.module";
import { WebhookLogModule } from "./webhook-log/webhook-log.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const isProd = configService.get<string>("NODE_ENV") === "production";

        const portRaw = configService.get<string>("DB_PORT") ?? "5432";
        const port = Number.parseInt(portRaw, 10);

        const synchronizeRaw = configService.get<string>("DB_SYNCHRONIZE");
        const synchronize = synchronizeRaw != null ? synchronizeRaw === "true" : !isProd;

        const logging = (configService.get<string>("DB_LOGGING") ?? "false") === "true";
        const ssl = (configService.get<string>("DB_SSL") ?? "false") === "true";

        const poolMaxRaw = configService.get<string>("DB_POOL_MAX") ?? "10";
        const poolMax = Number.parseInt(poolMaxRaw, 10);

        const poolIdleTimeoutMsRaw =
          configService.get<string>("DB_POOL_IDLE_TIMEOUT_MS") ?? "30000";
        const poolIdleTimeoutMs = Number.parseInt(poolIdleTimeoutMsRaw, 10);

        const poolConnTimeoutMsRaw = configService.get<string>("DB_POOL_CONN_TIMEOUT_MS") ?? "2000";
        const poolConnTimeoutMs = Number.parseInt(poolConnTimeoutMsRaw, 10);

        return {
          type: "postgres" as const,
          host: configService.get<string>("DB_HOST") ?? "localhost",
          port: Number.isNaN(port) ? 5432 : port,
          username: configService.get<string>("DB_USERNAME") ?? "postgres",
          password: configService.get<string>("DB_PASSWORD") ?? "postgres",
          database: configService.get<string>("DB_DATABASE") ?? "webhook_manager",
          autoLoadEntities: true,
          synchronize,
          logging,
          ssl: ssl ? { rejectUnauthorized: false } : false,
          extra: {
            max: Number.isNaN(poolMax) ? 10 : poolMax,
            idleTimeoutMillis: Number.isNaN(poolIdleTimeoutMs) ? 30_000 : poolIdleTimeoutMs,
            connectionTimeoutMillis: Number.isNaN(poolConnTimeoutMs) ? 2_000 : poolConnTimeoutMs,
          },
          retryAttempts: 5,
          retryDelay: 2_000,
        };
      },
    }),
    AuthModule,
    HookModule,
    UserModule,
    WebhookModule,
    WebhookLogModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
