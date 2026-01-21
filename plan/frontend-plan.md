# 前端开发计划 (React + Vite)

## 技术栈

- **构建工具**: Vite
- **框架**: React 18
- **UI 组件**: Ant Design 5
- **样式**: TailwindCSS
- **图表**: ECharts
- **路由**: React Router 6
- **状态管理**: Zustand
- **HTTP 客户端**: Axios

---

## 项目结构

```
packages/frontend/
├── src/
│   ├── main.tsx                   # 入口文件
│   ├── App.tsx                    # 根组件
│   ├── api/                       # API 封装
│   │   ├── client.ts              # Axios 实例配置
│   │   ├── auth.ts                # 认证 API
│   │   ├── webhook.ts             # Webhook API
│   │   └── stats.ts               # 统计 API
│   ├── components/                # 通用组件
│   │   ├── Layout/
│   │   │   ├── MainLayout.tsx     # 主布局
│   │   │   ├── Sidebar.tsx        # 侧边栏
│   │   │   └── Header.tsx         # 顶部导航
│   │   ├── Charts/
│   │   │   ├── RequestChart.tsx   # 请求统计图
│   │   │   └── StatusChart.tsx    # 状态分布图
│   │   └── Common/
│   │       ├── Loading.tsx
│   │       └── ErrorBoundary.tsx
│   ├── pages/                     # 页面组件
│   │   ├── Login/
│   │   │   └── index.tsx
│   │   ├── Dashboard/
│   │   │   └── index.tsx
│   │   ├── Webhooks/
│   │   │   ├── index.tsx          # 列表页
│   │   │   ├── Detail.tsx         # 详情页
│   │   │   └── Form.tsx           # 新建/编辑表单
│   │   └── History/
│   │       ├── index.tsx          # 历史列表
│   │       └── LogDetail.tsx      # 日志详情
│   ├── hooks/                     # 自定义 Hooks
│   │   ├── useAuth.ts
│   │   ├── useWebhooks.ts
│   │   └── useStats.ts
│   ├── store/                     # Zustand 状态
│   │   ├── authStore.ts
│   │   └── webhookStore.ts
│   ├── types/                     # TypeScript 类型
│   │   ├── auth.ts
│   │   ├── webhook.ts
│   │   └── api.ts
│   ├── utils/                     # 工具函数
│   │   ├── token.ts               # JWT 存储
│   │   └── format.ts              # 格式化
│   └── styles/
│       └── index.css              # Tailwind 入口
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
└── package.json
```

---

## 页面设计

### 1. 登录页 `/login`

- 用户名/密码表单
- 记住登录状态
- 错误提示

### 2. Dashboard `/`

- 统计卡片 (Webhook 数量、今日请求数、成功率)
- 请求趋势图 (ECharts 折线图)
- 最近请求列表

### 3. Webhook 管理 `/webhooks`

- 表格展示所有 Webhook
- 搜索/筛选功能
- 操作按钮 (编辑/删除/启用禁用)
- 新建 Webhook Modal

### 4. 历史记录 `/history`

- 请求日志表格
- 时间范围筛选
- 状态筛选
- 查看详情 (Headers/Payload/Response)

---

## 核心依赖

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.0.0",
    "antd": "^5.0.0",
    "echarts": "^5.0.0",
    "echarts-for-react": "^3.0.0",
    "axios": "^1.0.0",
    "zustand": "^4.0.0",
    "dayjs": "^1.0.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.0.0",
    "vite": "^5.0.0",
    "tailwindcss": "^3.0.0",
    "postcss": "^8.0.0",
    "autoprefixer": "^10.0.0",
    "typescript": "^5.0.0",
    "@types/react": "^18.0.0",
    "@types/react-dom": "^18.0.0"
  }
}
```

---

## 路由配置

```tsx
const routes = [
  { path: "/login", element: <Login />, public: true },
  {
    path: "/",
    element: <ProtectedLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: "webhooks", element: <Webhooks /> },
      { path: "webhooks/:id", element: <WebhookDetail /> },
      { path: "history", element: <History /> },
    ],
  },
];
```

---

## 状态管理 (Zustand)

### authStore

```typescript
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (credentials: LoginDto) => Promise<void>;
  logout: () => void;
}
```

### webhookStore

```typescript
interface WebhookState {
  webhooks: Webhook[];
  loading: boolean;
  fetchWebhooks: () => Promise<void>;
  createWebhook: (data: CreateWebhookDto) => Promise<void>;
  updateWebhook: (id: string, data: UpdateWebhookDto) => Promise<void>;
  deleteWebhook: (id: string) => Promise<void>;
}
```

---

## 开发任务清单

- [ ] 初始化 Vite + React 项目
- [ ] 配置 TailwindCSS
- [ ] 配置 Ant Design
- [ ] 设置路由结构
- [ ] 实现 API 客户端 (Axios)
- [ ] 实现 Zustand 状态管理
- [ ] 创建 MainLayout 布局
- [ ] 实现登录页面
- [ ] 实现 Dashboard 页面
- [ ] 实现 Webhook 管理页面
- [ ] 实现历史记录页面
- [ ] 集成 ECharts 图表
- [ ] 添加响应式适配
