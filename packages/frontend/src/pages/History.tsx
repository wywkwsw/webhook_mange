import {
  Button,
  Table,
  Tag,
  Space,
  Drawer,
  Descriptions,
  DatePicker,
  message,
  Card,
  Row,
  Col,
} from "antd";
import { EyeOutlined, ReloadOutlined } from "@ant-design/icons";
import { useState } from "react";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;

interface LogEntry {
  id: string;
  webhookName: string;
  url: string;
  method: string;
  status: "success" | "failed";
  statusCode: number;
  duration: number;
  timestamp: string;
  requestHeaders: Record<string, string>;
  requestBody: unknown;
  responseBody: unknown;
}

const History = () => {
  const [loading, setLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Mock Data
  const mockLogs: LogEntry[] = Array.from({ length: 20 }).map((_, i) => ({
    id: `log-${i + 1}`,
    webhookName:
      i % 3 === 0 ? "支付通知" : i % 3 === 1 ? "用户注册" : "告警系统",
    url: "https://api.example.com/webhook",
    method: i % 3 === 1 ? "GET" : "POST",
    status: i % 5 === 0 ? "failed" : "success",
    statusCode: i % 5 === 0 ? 500 : 200,
    duration: Math.floor(Math.random() * 500) + 50,
    timestamp: dayjs()
      .subtract(i * 15, "minute")
      .toISOString(),
    requestHeaders: {
      "Content-Type": "application/json",
      Authorization: "Bearer token-123",
    },
    requestBody: {
      event: "payment.created",
      amount: 100 * (i + 1),
      currency: "CNY",
    },
    responseBody: {
      success: i % 5 !== 0,
      message: i % 5 === 0 ? "服务器内部错误" : "处理成功",
    },
  }));

  const [logs, setLogs] = useState<LogEntry[]>(mockLogs);

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLogs([...mockLogs].sort(() => Math.random() - 0.5));
      setLoading(false);
      message.success("日志已刷新");
    }, 800);
  };

  const handleViewDetail = (log: LogEntry) => {
    setSelectedLog(log);
    setIsDrawerOpen(true);
  };

  const columns = [
    {
      title: "时间",
      dataIndex: "timestamp",
      key: "timestamp",
      render: (text: string) => dayjs(text).format("YYYY-MM-DD HH:mm:ss"),
    },
    {
      title: "Webhook 名称",
      dataIndex: "webhookName",
      key: "webhookName",
    },
    {
      title: "请求方法",
      dataIndex: "method",
      key: "method",
      render: (method: string) => (
        <Tag color={method === "GET" ? "blue" : "green"}>{method}</Tag>
      ),
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      render: (status: string, record: LogEntry) => (
        <Tag color={status === "success" ? "success" : "error"}>
          {record.statusCode} {status === "success" ? "成功" : "失败"}
        </Tag>
      ),
    },
    {
      title: "响应时间",
      dataIndex: "duration",
      key: "duration",
      render: (duration: number) => `${duration}ms`,
    },
    {
      title: "操作",
      key: "actions",
      render: (_: unknown, record: LogEntry) => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => handleViewDetail(record)}
        >
          查看
        </Button>
      ),
    },
  ];

  const stats = [
    {
      label: "总请求数",
      value: logs.length,
      color: "#3b82f6",
    },
    {
      label: "成功请求",
      value: logs.filter((l) => l.status === "success").length,
      color: "#22c55e",
    },
    {
      label: "失败请求",
      value: logs.filter((l) => l.status === "failed").length,
      color: "#ef4444",
    },
    {
      label: "平均响应",
      value: `${Math.round(logs.reduce((acc, l) => acc + l.duration, 0) / logs.length)}ms`,
      color: "#8b5cf6",
    },
  ];

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-primary m-0">历史记录</h1>
          <p className="text-secondary m-0 mt-1">
            查看所有 Webhook 请求的历史日志
          </p>
        </div>
        <Space>
          <RangePicker showTime placeholder={["开始时间", "结束时间"]} />
          <Button
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
            loading={loading}
          >
            刷新
          </Button>
        </Space>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]}>
        {stats.map((stat, index) => (
          <Col xs={12} lg={6} key={index}>
            <div className="stat-card">
              <p className="text-secondary text-sm m-0">{stat.label}</p>
              <p
                className="text-2xl font-bold m-0 mt-1"
                style={{ color: stat.color }}
              >
                {stat.value}
              </p>
            </div>
          </Col>
        ))}
      </Row>

      {/* 表格 */}
      <Card bordered={false}>
        <Table
          columns={columns}
          dataSource={logs}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          scroll={{ x: 900 }}
        />
      </Card>

      {/* 详情抽屉 */}
      <Drawer
        title="请求详情"
        width={600}
        onClose={() => setIsDrawerOpen(false)}
        open={isDrawerOpen}
      >
        {selectedLog && (
          <div className="space-y-6">
            <Descriptions title="基本信息" bordered column={1}>
              <Descriptions.Item label="请求 ID">
                {selectedLog.id}
              </Descriptions.Item>
              <Descriptions.Item label="时间">
                {dayjs(selectedLog.timestamp).format("YYYY-MM-DD HH:mm:ss")}
              </Descriptions.Item>
              <Descriptions.Item label="目标地址">
                {selectedLog.url}
              </Descriptions.Item>
              <Descriptions.Item label="状态码">
                <Tag
                  color={selectedLog.status === "success" ? "success" : "error"}
                >
                  {selectedLog.statusCode}{" "}
                  {selectedLog.status === "success" ? "成功" : "失败"}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="响应时间">
                {selectedLog.duration}ms
              </Descriptions.Item>
            </Descriptions>

            <div>
              <h4 className="text-primary font-medium mb-3">请求头</h4>
              <div className="code-block">
                <pre className="m-0 text-sm" style={{ color: "#94a3b8" }}>
                  {JSON.stringify(selectedLog.requestHeaders, null, 2)}
                </pre>
              </div>
            </div>

            <div>
              <h4 className="text-primary font-medium mb-3">请求体</h4>
              <div className="code-block">
                <pre className="m-0 text-sm" style={{ color: "#94a3b8" }}>
                  {JSON.stringify(selectedLog.requestBody, null, 2)}
                </pre>
              </div>
            </div>

            <div>
              <h4 className="text-primary font-medium mb-3">响应体</h4>
              <div className="code-block">
                <pre className="m-0 text-sm" style={{ color: "#94a3b8" }}>
                  {JSON.stringify(selectedLog.responseBody, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default History;
