import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  Descriptions,
  Table,
  Tag,
  Button,
  Space,
  Typography,
  Spin,
  message,
  Modal,
} from "antd";
import {
  ArrowLeftOutlined,
  CopyOutlined,
  LockOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
  LinkOutlined,
} from "@ant-design/icons";
import { useWebhookStore } from "../store/webhookStore";
import type { WebhookLog } from "../types/webhook";
import dayjs from "dayjs";

const { Text } = Typography;

const WebhookDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    currentWebhook,
    webhookLogs,
    loading,
    fetchWebhook,
    fetchWebhookLogs,
  } = useWebhookStore();
  const [selectedLog, setSelectedLog] = useState<WebhookLog | null>(null);

  useEffect(() => {
    if (id) {
      fetchWebhook(id);
      fetchWebhookLogs(id);
    }
  }, [id, fetchWebhook, fetchWebhookLogs]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    message.success("已复制到剪贴板");
  };

  const getWebhookUrl = () => {
    if (!currentWebhook) return "";
    const baseUrl = window.location.origin;
    return `${baseUrl}/hook/${currentWebhook.path}`;
  };

  const refreshLogs = () => {
    if (id) {
      fetchWebhookLogs(id);
      message.success("日志已刷新");
    }
  };

  const columns = [
    {
      title: "时间",
      dataIndex: "receivedAt",
      key: "receivedAt",
      width: 180,
      render: (time: string) => (
        <span className="text-gray-300 mono text-sm">
          {dayjs(time).format("YYYY-MM-DD HH:mm:ss")}
        </span>
      ),
    },
    {
      title: "方法",
      dataIndex: "method",
      key: "method",
      width: 100,
      render: (method: string) => (
        <Tag color={method === "POST" ? "cyan" : method === "GET" ? "blue" : "orange"}>
          {method}
        </Tag>
      ),
    },
    {
      title: "状态",
      dataIndex: "statusCode",
      key: "statusCode",
      width: 100,
      render: (code: number) => (
        <Tag
          icon={code < 400 ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
          color={code < 400 ? "success" : "error"}
        >
          {code}
        </Tag>
      ),
    },
    {
      title: "操作",
      key: "actions",
      width: 100,
      render: (_: unknown, record: WebhookLog) => (
        <Button 
          type="link" 
          size="small" 
          onClick={() => setSelectedLog(record)}
          className="text-cyan-400"
        >
          查看详情
        </Button>
      ),
    },
  ];

  if (loading && !currentWebhook) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  if (!currentWebhook) {
    return (
      <div className="p-4">
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/webhooks")}>
          返回列表
        </Button>
        <div className="mt-4 text-center text-gray-500">未找到 Webhook</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 顶部导航 */}
      <div className="flex items-center gap-4">
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate("/webhooks")}
          className="text-gray-400 hover:text-cyan-400"
        >
          返回
        </Button>
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)' }}
          >
            <LinkOutlined className="text-white text-lg" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{currentWebhook.name}</h1>
            <p className="text-gray-400 text-sm mono">/{currentWebhook.path}</p>
          </div>
        </div>
        <Tag 
          color={currentWebhook.isActive ? "cyan" : "default"}
          className="ml-2"
        >
          {currentWebhook.isActive ? "已启用" : "已禁用"}
        </Tag>
      </div>

      {/* 详情卡片 */}
      <div className="chart-container">
        <h3 className="text-lg font-semibold text-white mb-4">基本信息</h3>
        <Descriptions 
          column={2} 
          labelStyle={{ color: '#9ca3af' }}
          contentStyle={{ color: '#f3f4f6' }}
        >
          <Descriptions.Item label="ID">
            <span className="mono text-sm">{currentWebhook.id}</span>
          </Descriptions.Item>
          <Descriptions.Item label="路径">
            <span className="mono">/{currentWebhook.path}</span>
          </Descriptions.Item>
          <Descriptions.Item label="接收地址" span={2}>
            <Space>
              <Text code className="text-cyan-400 mono">{getWebhookUrl()}</Text>
              <Button
                type="text"
                size="small"
                icon={<CopyOutlined />}
                onClick={() => copyToClipboard(getWebhookUrl())}
                className="text-gray-400 hover:text-cyan-400"
              />
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="密钥验证">
            {currentWebhook.secret ? (
              <Tag icon={<LockOutlined />} color="cyan">
                已设置
              </Tag>
            ) : (
              <Tag color="default">未设置</Tag>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">
            <span className="mono text-sm">
              {dayjs(currentWebhook.createdAt).format("YYYY-MM-DD HH:mm:ss")}
            </span>
          </Descriptions.Item>
        </Descriptions>
      </div>

      {/* 请求日志 */}
      <div className="chart-container">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">请求日志</h3>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={refreshLogs}
            className="text-gray-400 hover:text-cyan-400"
          >
            刷新
          </Button>
        </div>
        <Table
          columns={columns}
          dataSource={webhookLogs}
          rowKey="id"
          loading={loading}
          pagination={{ 
            pageSize: 10,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          locale={{ emptyText: '暂无请求记录' }}
        />
      </div>

      {/* 详情弹窗 */}
      <Modal
        title="请求详情"
        open={!!selectedLog}
        onCancel={() => setSelectedLog(null)}
        footer={null}
        width={700}
      >
        {selectedLog && (
          <div className="space-y-4">
            <Descriptions 
              column={2} 
              bordered 
              size="small"
              labelStyle={{ background: 'rgba(6, 182, 212, 0.1)' }}
            >
              <Descriptions.Item label="请求方法">{selectedLog.method}</Descriptions.Item>
              <Descriptions.Item label="状态码">
                <Tag color={selectedLog.statusCode < 400 ? "success" : "error"}>
                  {selectedLog.statusCode}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="接收时间" span={2}>
                {dayjs(selectedLog.receivedAt).format("YYYY-MM-DD HH:mm:ss")}
              </Descriptions.Item>
            </Descriptions>

            <div>
              <Text strong className="text-gray-300">请求头:</Text>
              <pre className="bg-gray-800 p-3 rounded-lg mt-2 text-xs overflow-auto max-h-40 text-gray-300 mono border border-gray-700">
                {JSON.stringify(selectedLog.headers, null, 2)}
              </pre>
            </div>

            <div>
              <Text strong className="text-gray-300">请求体:</Text>
              <pre className="bg-gray-800 p-3 rounded-lg mt-2 text-xs overflow-auto max-h-40 text-gray-300 mono border border-gray-700">
                {selectedLog.payload
                  ? JSON.stringify(selectedLog.payload, null, 2)
                  : "无请求体"}
              </pre>
            </div>

            <div>
              <Text strong className="text-gray-300">响应内容:</Text>
              <pre className="bg-gray-800 p-3 rounded-lg mt-2 text-xs overflow-auto max-h-40 text-gray-300 mono border border-gray-700">
                {selectedLog.response
                  ? JSON.stringify(selectedLog.response, null, 2)
                  : "无响应内容"}
              </pre>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default WebhookDetail;
