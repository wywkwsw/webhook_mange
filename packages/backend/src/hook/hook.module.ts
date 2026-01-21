import { Module } from "@nestjs/common";
import { WebhookModule } from "../webhook/webhook.module";
import { WebhookLogModule } from "../webhook-log/webhook-log.module";
import { ForwardModule } from "../forward/forward.module";
import { HookController } from "./hook.controller";

@Module({
  imports: [WebhookModule, WebhookLogModule, ForwardModule],
  controllers: [HookController],
})
export class HookModule {}
