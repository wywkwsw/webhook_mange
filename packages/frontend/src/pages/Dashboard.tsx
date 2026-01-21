import { Card, Row, Col } from "antd";
import {
  ApiOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ArrowUpOutlined,
} from "@ant-design/icons";
import { useWebhookStore } from "../store/webhookStore";
import { useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const Dashboard = () => {
  const { webhooks, fetchWebhooks } = useWebhookStore();

  useEffect(() => {
    fetchWebhooks();
  }, [fetchWebhooks]);

  // 模拟数据
  const weeklyData = [
    { name: "周一", requests: 820 },
    { name: "周二", requests: 932 },
    { name: "周三", requests: 901 },
    { name: "周四", requests: 1234 },
    { name: "周五", requests: 1290 },
    { name: "周六", requests: 1330 },
    { name: "周日", requests: 1450 },
  ];

  const statusData = [
    { name: "成功", value: 85, color: "#22c55e" },
    { name: "失败", value: 15, color: "#ef4444" },
  ];

  const recentActivity = [
    { name: "支付通知", time: "2 分钟前", method: "POST", success: true },
    { name: "用户注册", time: "5 分钟前", method: "POST", success: true },
    { name: "告警系统", time: "12 分钟前", method: "GET", success: false },
    { name: "订单回调", time: "15 分钟前", method: "POST", success: true },
    { name: "日报任务", time: "1 小时前", method: "PUT", success: true },
  ];

  const stats = [
    {
      title: "Webhook 总数",
      value: webhooks.length || 1,
      suffix: "个",
      desc: `${webhooks.filter((w) => w.isActive).length || 1} 个已启用`,
      icon: <ApiOutlined />,
      color: "#3b82f6",
    },
    {
      title: "今日请求",
      value: "1,450",
      suffix: "",
      desc: "↑ 12.5% 较昨日",
      icon: <ThunderboltOutlined />,
      color: "#f59e0b",
    },
    {
      title: "成功率",
      value: "98.5",
      suffix: "%",
      desc: "运行状态良好",
      icon: <CheckCircleOutlined />,
      color: "#22c55e",
    },
    {
      title: "平均响应",
      value: "45",
      suffix: "ms",
      desc: "低延迟响应",
      icon: <ClockCircleOutlined />,
      color: "#8b5cf6",
    },
  ];

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="page-header">
        <h1 className="text-2xl font-semibold text-primary m-0">数据概览</h1>
        <p className="text-secondary m-0 mt-1">实时监控 Webhook 运行状态</p>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]}>
        {stats.map((stat, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <div className="stat-card h-full">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-secondary text-sm m-0">{stat.title}</p>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span
                      className="text-3xl font-bold"
                      style={{ color: stat.color }}
                    >
                      {stat.value}
                    </span>
                    <span className="text-secondary text-sm">{stat.suffix}</span>
                  </div>
                  <p className="text-muted text-xs m-0 mt-2">{stat.desc}</p>
                </div>
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                  style={{
                    background: `${stat.color}15`,
                    color: stat.color,
                  }}
                >
                  {stat.icon}
                </div>
              </div>
            </div>
          </Col>
        ))}
      </Row>

      {/* 图表区域 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card
            title="请求趋势"
            extra={<span className="text-secondary text-sm">最近 7 天</span>}
            bordered={false}
          >
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyData}>
                  <defs>
                    <linearGradient id="colorReq" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e2e8f0"
                  />
                  <XAxis
                    dataKey="name"
                    stroke="#64748b"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#ffffff",
                      border: "1px solid #e2e8f0",
                      borderRadius: 8,
                      color: "#1e293b",
                    }}
                    labelStyle={{ color: "#64748b" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="requests"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorReq)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="状态分布" bordered={false}>
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "#ffffff",
                      border: "1px solid #e2e8f0",
                      borderRadius: 8,
                      color: "#1e293b",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-6 -mt-4">
                {statusData.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ background: item.color }}
                    />
                    <span className="text-secondary text-sm">{item.name}</span>
                    <span className="text-primary font-medium">
                      {item.value}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 最近活动 */}
      <Card
        title="最近活动"
        extra={
          <a href="/history" className="text-sm" style={{ color: "#3b82f6" }}>
            查看全部 <ArrowUpOutlined rotate={45} />
          </a>
        }
        bordered={false}
      >
        <div className="space-y-3">
          {recentActivity.map((activity, index) => (
            <div
              key={index}
              className="activity-item flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`status-dot ${activity.success ? "success" : "error"}`}
                />
                <div>
                  <p className="text-primary m-0 font-medium">{activity.name}</p>
                  <p className="text-muted text-xs m-0">{activity.time}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="text-xs font-medium px-2 py-1 rounded"
                  style={{
                    background: "rgba(59, 130, 246, 0.1)",
                    color: "#3b82f6",
                  }}
                >
                  {activity.method}
                </span>
                <div
                  className={`status-dot ${activity.success ? "success" : "error"}`}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;
