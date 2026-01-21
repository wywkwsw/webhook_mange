import { Module } from "@nestjs/common";
import { WebhookModule } from "../webhook/webhook.module";
import { HookController } from "./hook.controller";

@Module({
  imports: [WebhookModule],
  controllers: [HookController],
})
export class HookModule {}
