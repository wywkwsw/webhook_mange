import { Card, Row, Col, Spin, Empty } from "antd";
import {
  ApiOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from "@ant-design/icons";
import { useEffect, useState } from "react";
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
import client from "../api/client";

interface DashboardStats {
  totalWebhooks: number;
  activeWebhooks: number;
  todayRequests: number;
  yesterdayRequests: number;
  successRate: number;
  avgResponseTime: number;
  weeklyData: { name: string; requests: number; success: number; failed: number }[];
  statusDistribution: { name: string; value: number; color: string }[];
  recentActivity: {
    id: string;
    name: string;
    path: string;
    time: string;
    method: string;
    success: boolean;
  }[];
}

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await client.get<DashboardStats>("/logs/stats");
        setStats(response.data);
        setError(null);
      } catch (err) {
        setError("加载统计数据失败");
        console.error("Failed to fetch dashboard stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex items-center justify-center h-96">
        <Empty description={error || "暂无数据"} />
      </div>
    );
  }

  // Calculate request change percentage
  const requestChange = stats.yesterdayRequests > 0 
    ? ((stats.todayRequests - stats.yesterdayRequests) / stats.yesterdayRequests * 100).toFixed(1)
    : stats.todayRequests > 0 ? "100" : "0";
  const isRequestUp = Number(requestChange) >= 0;

  const statCards = [
    {
      title: "Webhook 总数",
      value: stats.totalWebhooks,
      suffix: "个",
      desc: `${stats.activeWebhooks} 个已启用`,
      icon: <ApiOutlined />,
      color: "#3b82f6",
    },
    {
      title: "今日请求",
      value: stats.todayRequests.toLocaleString(),
      suffix: "",
      desc: (
        <span style={{ color: isRequestUp ? "#22c55e" : "#ef4444" }}>
          {isRequestUp ? <ArrowUpOutlined /> : <ArrowDownOutlined />} {Math.abs(Number(requestChange))}% 较昨日
        </span>
      ),
      icon: <ThunderboltOutlined />,
      color: "#f59e0b",
    },
    {
      title: "成功率",
      value: stats.successRate.toFixed(1),
      suffix: "%",
      desc: stats.successRate >= 95 ? "运行状态良好" : stats.successRate >= 80 ? "需要关注" : "异常",
      icon: <CheckCircleOutlined />,
      color: stats.successRate >= 95 ? "#22c55e" : stats.successRate >= 80 ? "#f59e0b" : "#ef4444",
    },
    {
      title: "平均响应",
      value: stats.avgResponseTime,
      suffix: "ms",
      desc: stats.avgResponseTime < 100 ? "低延迟响应" : stats.avgResponseTime < 500 ? "响应正常" : "响应较慢",
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
        {statCards.map((stat, index) => (
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
              {stats.weeklyData.some(d => d.requests > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.weeklyData}>
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
                      formatter={(value, name) => {
                        const labels: Record<string, string> = {
                          requests: "总请求",
                          success: "成功",
                          failed: "失败",
                        };
                        return [value ?? 0, labels[String(name)] || String(name)];
                      }}
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
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Empty description="暂无请求数据" />
                </div>
              )}
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="状态分布" bordered={false}>
            <div style={{ height: 300 }}>
              {stats.statusDistribution.some(d => d.value > 0) ? (
                <>
                  <ResponsiveContainer width="100%" height="80%">
                    <PieChart>
                      <Pie
                        data={stats.statusDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {stats.statusDistribution.map((entry, index) => (
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
                  <div className="flex justify-center gap-6">
                    {stats.statusDistribution.map((item, index) => (
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
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Empty description="暂无状态数据" />
                </div>
              )}
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
        {stats.recentActivity.length > 0 ? (
          <div className="space-y-3">
            {stats.recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="activity-item flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`status-dot ${activity.success ? "success" : "error"}`}
                  />
                  <div>
                    <p className="text-primary m-0 font-medium">{activity.name}</p>
                    <p className="text-muted text-xs m-0">/{activity.path} · {activity.time}</p>
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
        ) : (
          <Empty description="暂无活动记录" />
        )}
      </Card>
    </div>
  );
};

export default Dashboard;
