# 后端开发计划 (NestJS)

## 技术栈

- **框架**: NestJS
- **ORM**: TypeORM
- **数据库**: PostgreSQL
- **认证**: JWT + Passport
- **文档**: Swagger

---

## 项目结构

```
packages/backend/
├── src/
│   ├── app.module.ts
│   ├── main.ts
│   ├── auth/                      # 认证模块
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── jwt.strategy.ts
│   │   ├── jwt-auth.guard.ts
│   │   └── dto/
│   │       ├── login.dto.ts
│   │       └── register.dto.ts
│   ├── user/                      # 用户模块
│   │   ├── user.module.ts
│   │   ├── user.service.ts
│   │   └── entities/
│   │       └── user.entity.ts
│   ├── webhook/                   # Webhook模块
│   │   ├── webhook.module.ts
│   │   ├── webhook.controller.ts
│   │   ├── webhook.service.ts
│   │   ├── webhook.gateway.ts     # WebSocket (可选)
│   │   ├── entities/
│   │   │   └── webhook.entity.ts
│   │   └── dto/
│   │       ├── create-webhook.dto.ts
│   │       └── update-webhook.dto.ts
│   └── webhook-log/               # 日志模块
│       ├── webhook-log.module.ts
│       ├── webhook-log.controller.ts
│       ├── webhook-log.service.ts
│       └── entities/
│           └── webhook-log.entity.ts
├── test/
├── package.json
├── tsconfig.json
├── nest-cli.json
└── .env.example
```

---

## 数据库设计

### User Entity

```typescript
@Entity()
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  username: string;

  @Column()
  passwordHash: string;

  @Column({ nullable: true })
  email: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Webhook, (webhook) => webhook.user)
  webhooks: Webhook[];
}
```

### Webhook Entity

```typescript
@Entity()
export class Webhook {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  path: string;

  @Column({ nullable: true })
  secret: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: "jsonb", nullable: true })
  config: Record<string, any>;

  @ManyToOne(() => User, (user) => user.webhooks)
  user: User;

  @OneToMany(() => WebhookLog, (log) => log.webhook)
  logs: WebhookLog[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### WebhookLog Entity

```typescript
@Entity()
export class WebhookLog {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  method: string;

  @Column({ type: "jsonb" })
  headers: Record<string, string>;

  @Column({ type: "jsonb", nullable: true })
  payload: any;

  @Column()
  statusCode: number;

  @Column({ type: "jsonb", nullable: true })
  response: any;

  @ManyToOne(() => Webhook, (webhook) => webhook.logs)
  webhook: Webhook;

  @CreateDateColumn()
  receivedAt: Date;
}
```

---

## API 设计

### Auth 模块

| Method | Endpoint             | Description      |
| ------ | -------------------- | ---------------- |
| POST   | `/api/auth/register` | 用户注册         |
| POST   | `/api/auth/login`    | 用户登录         |
| GET    | `/api/auth/profile`  | 获取当前用户信息 |

### Webhook 模块

| Method | Endpoint                   | Description      |
| ------ | -------------------------- | ---------------- |
| GET    | `/api/webhooks`            | 获取所有 webhook |
| POST   | `/api/webhooks`            | 创建 webhook     |
| GET    | `/api/webhooks/:id`        | 获取单个 webhook |
| PATCH  | `/api/webhooks/:id`        | 更新 webhook     |
| DELETE | `/api/webhooks/:id`        | 删除 webhook     |
| POST   | `/api/webhooks/:id/toggle` | 切换启用状态     |

### Webhook 接收端点

| Method | Endpoint      | Description           |
| ------ | ------------- | --------------------- |
| ALL    | `/hook/:path` | 动态接收 webhook 请求 |

### Webhook Log 模块

| Method | Endpoint                 | Description           |
| ------ | ------------------------ | --------------------- |
| GET    | `/api/webhooks/:id/logs` | 获取 webhook 历史记录 |
| GET    | `/api/logs/:logId`       | 获取单条日志详情      |
| GET    | `/api/stats`             | 获取统计数据          |

---

## 核心依赖

```json
{
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/platform-express": "^10.0.0",
    "@nestjs/typeorm": "^10.0.0",
    "@nestjs/passport": "^10.0.0",
    "@nestjs/jwt": "^10.0.0",
    "@nestjs/swagger": "^7.0.0",
    "typeorm": "^0.3.0",
    "pg": "^8.0.0",
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.0",
    "bcrypt": "^5.0.0",
    "class-validator": "^0.14.0",
    "class-transformer": "^0.5.0"
  }
}
```

---

## 开发任务清单

- [ ] 初始化 NestJS 项目
- [ ] 配置 TypeORM 连接 PostgreSQL
- [ ] 创建 User Entity 和 UserService
- [ ] 实现 Auth 模块 (JWT 登录/注册)
- [ ] 实现 Webhook CRUD
- [ ] 实现动态 webhook 接收端点
- [ ] 实现 WebhookLog 记录
- [ ] 添加 Swagger 文档
- [ ] 编写单元测试
- [ ] PM2 配置
