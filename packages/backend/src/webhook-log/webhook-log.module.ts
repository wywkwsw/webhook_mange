import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { WebhookModule } from "../webhook/webhook.module";
import { WebhookLogController } from "./webhook-log.controller";
import { WebhookLog } from "./entities/webhook-log.entity";
import { WebhookLogService } from "./webhook-log.service";

@Module({
  imports: [TypeOrmModule.forFeature([WebhookLog]), WebhookModule],
  controllers: [WebhookLogController],
  providers: [WebhookLogService],
  exports: [WebhookLogService],
})
export class WebhookLogModule {}
