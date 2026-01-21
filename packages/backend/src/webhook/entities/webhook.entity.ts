import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { User } from "../../user/entities/user.entity";

/**
 * 转发配置类型
 */
export interface ForwardConfig {
  /** 是否启用转发 */
  enabled: boolean;
  /** 目标 URL */
  targetUrl: string;
  /** HTTP 方法 */
  method: "GET" | "POST" | "PUT" | "PATCH";
  /** 自定义请求头 */
  headers?: Record<string, string>;
  /** 消息模板（支持变量替换: {{payload}}, {{payload.xxx}}, {{time}}, {{method}} 等） */
  bodyTemplate?: string;
  /** 超时时间（毫秒） */
  timeout?: number;
  /** 重试次数 */
  retryCount?: number;
}

@Entity()
export class Webhook {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  path: string;

  @Column({ type: "varchar", nullable: true })
  secret: string | null;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: "jsonb", nullable: true })
  config: Record<string, unknown> | null;

  /** 转发配置 */
  @Column({ type: "jsonb", nullable: true })
  forwardConfig: ForwardConfig | null;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
