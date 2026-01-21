import { Col, Row, List, Tag, Typography } from "antd";
import {
  ApiOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { StatsCard } from "../components/Dashboard/StatsCard";
import { RequestChart } from "../components/Charts/RequestChart";
import { useEffect, useState } from "react";

const { Title } = Typography;

const Dashboard = () => {
  const [loading, setLoading] = useState(true);

  // Mock Data
  const stats = {
    totalWebhooks: 12,
    todayRequests: 1450,
    successRate: 98.5,
  };

  const chartData = [
    { date: "Mon", count: 820 },
    { date: "Tue", count: 932 },
    { date: "Wed", count: 901 },
    { date: "Thu", count: 934 },
    { date: "Fri", count: 1290 },
    { date: "Sat", count: 1330 },
    { date: "Sun", count: 1320 },
  ];

  const recentActivity = [
    {
      id: "1",
      webhook: "Payment Hook",
      status: "success",
      time: "2 mins ago",
      method: "POST",
    },
    {
      id: "2",
      webhook: "User Signup",
      status: "success",
      time: "5 mins ago",
      method: "POST",
    },
    {
      id: "3",
      webhook: "Alert System",
      status: "failed",
      time: "12 mins ago",
      method: "GET",
    },
    {
      id: "4",
      webhook: "Payment Hook",
      status: "success",
      time: "15 mins ago",
      method: "POST",
    },
    {
      id: "5",
      webhook: "Daily Report",
      status: "success",
      time: "1 hour ago",
      method: "PUT",
    },
  ];

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-6">
      <Title level={2}>Dashboard</Title>

      {/* Stats Row */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <StatsCard
            title="Total Webhooks"
            value={stats.totalWebhooks}
            prefix={<ApiOutlined />}
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={8}>
          <StatsCard
            title="Today's Requests"
            value={stats.todayRequests}
            prefix={<ThunderboltOutlined />}
            valueStyle={{ color: "#3f8600" }}
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={8}>
          <StatsCard
            title="Success Rate"
            value={stats.successRate}
            precision={1}
            suffix="%"
            prefix={<CheckCircleOutlined />}
            valueStyle={{ color: "#3f8600" }}
            loading={loading}
          />
        </Col>
      </Row>

      {/* Main Content Row */}
      <Row gutter={[16, 16]}>
        {/* Chart Column */}
        <Col xs={24} lg={16}>
          <RequestChart data={chartData} loading={loading} />
        </Col>

        {/* Activity Column */}
        <Col xs={24} lg={8}>
          <div className="bg-white p-4 rounded-lg shadow-sm h-full">
            <h3 className="font-semibold text-lg mb-4">Recent Activity</h3>
            <List
              loading={loading}
              itemLayout="horizontal"
              dataSource={recentActivity}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <div className="mt-1">
                        {item.status === "success" ? (
                          <CheckCircleOutlined className="text-green-500 text-lg" />
                        ) : (
                          <ClockCircleOutlined className="text-red-500 text-lg" />
                        )}
                      </div>
                    }
                    title={<span className="font-medium">{item.webhook}</span>}
                    description={
                      <div className="flex justify-between items-center text-xs">
                        <Tag color={item.method === "GET" ? "blue" : "green"}>
                          {item.method}
                        </Tag>
                        <span>{item.time}</span>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
