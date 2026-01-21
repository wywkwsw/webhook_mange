import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Webhook } from "../../webhook/entities/webhook.entity";

@Entity()
export class WebhookLog {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  method: string;

  @Column({ type: "jsonb" })
  headers: Record<string, string>;

  @Column({ type: "jsonb", nullable: true })
  payload: unknown | null;

  @Column()
  statusCode: number;

  @Column({ type: "jsonb", nullable: true })
  response: unknown | null;

  @ManyToOne(() => Webhook, { onDelete: "CASCADE" })
  webhook: Webhook;

  @CreateDateColumn()
  receivedAt: Date;
}
