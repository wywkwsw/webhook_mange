import {
  Button,
  Table,
  Tag,
  Space,
  Drawer,
  Descriptions,
  DatePicker,
  message,
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
  requestBody: any;
  responseBody: any;
}

const History = () => {
  const [loading, setLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Mock Data
  const mockLogs: LogEntry[] = Array.from({ length: 20 }).map((_, i) => ({
    id: `log-${i + 1}`,
    webhookName:
      i % 3 === 0
        ? "Payment Hook"
        : i % 3 === 1
          ? "User Signup"
          : "Alert System",
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
      currency: "USD",
    },
    responseBody: {
      success: i % 5 !== 0,
      message: i % 5 === 0 ? "Internal Server Error" : "Processed successfully",
    },
  }));

  const [logs, setLogs] = useState<LogEntry[]>(mockLogs);

  const handleRefresh = () => {
    setLoading(true);
    // Simulate fetch with new data
    setTimeout(() => {
      setLogs([...mockLogs].sort(() => Math.random() - 0.5));
      setLoading(false);
      message.success("Logs refreshed");
    }, 800);
  };

  const handleViewDetail = (log: LogEntry) => {
    setSelectedLog(log);
    setIsDrawerOpen(true);
  };

  const columns = [
    {
      title: "Time",
      dataIndex: "timestamp",
      key: "timestamp",
      render: (text: string) => dayjs(text).format("YYYY-MM-DD HH:mm:ss"),
    },
    {
      title: "Webhook",
      dataIndex: "webhookName",
      key: "webhookName",
    },
    {
      title: "Method",
      dataIndex: "method",
      key: "method",
      render: (method: string) => (
        <Tag color={method === "GET" ? "blue" : "green"}>{method}</Tag>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string, record: LogEntry) => (
        <Tag color={status === "success" ? "success" : "error"}>
          {record.statusCode} {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: "Latency",
      dataIndex: "duration",
      key: "duration",
      render: (duration: number) => `${duration}ms`,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: LogEntry) => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => handleViewDetail(record)}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Request History</h2>
        <Space>
          <RangePicker showTime />
          <Button
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
            loading={loading}
          >
            Refresh
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={logs}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Drawer
        title="Request Details"
        width={600}
        onClose={() => setIsDrawerOpen(false)}
        open={isDrawerOpen}
      >
        {selectedLog && (
          <div className="space-y-6">
            <Descriptions title="Summary" bordered column={1}>
              <Descriptions.Item label="ID">{selectedLog.id}</Descriptions.Item>
              <Descriptions.Item label="Timestamp">
                {dayjs(selectedLog.timestamp).format("YYYY-MM-DD HH:mm:ss")}
              </Descriptions.Item>
              <Descriptions.Item label="URL">
                {selectedLog.url}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag
                  color={selectedLog.status === "success" ? "success" : "error"}
                >
                  {selectedLog.statusCode}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Latency">
                {selectedLog.duration}ms
              </Descriptions.Item>
            </Descriptions>

            <div>
              <h3 className="font-semibold mb-2">Request Headers</h3>
              <div className="bg-gray-50 p-3 rounded overflow-auto max-h-40 font-mono text-xs">
                <pre>{JSON.stringify(selectedLog.requestHeaders, null, 2)}</pre>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Request Body</h3>
              <div className="bg-gray-50 p-3 rounded overflow-auto max-h-60 font-mono text-xs">
                <pre>{JSON.stringify(selectedLog.requestBody, null, 2)}</pre>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Response Body</h3>
              <div className="bg-gray-50 p-3 rounded overflow-auto max-h-60 font-mono text-xs">
                <pre>{JSON.stringify(selectedLog.responseBody, null, 2)}</pre>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default History;
