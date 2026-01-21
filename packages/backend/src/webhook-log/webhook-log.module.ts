import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { WebhookModule } from "../webhook/webhook.module";
import { LogsController, WebhookLogController } from "./webhook-log.controller";
import { WebhookLog } from "./entities/webhook-log.entity";
import { WebhookLogService } from "./webhook-log.service";

@Module({
  imports: [TypeOrmModule.forFeature([WebhookLog]), WebhookModule],
  controllers: [WebhookLogController, LogsController],
  providers: [WebhookLogService],
  exports: [WebhookLogService],
})
export class WebhookLogModule {}
