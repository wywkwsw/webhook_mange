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
  Spin,
  Modal,
  Input,
  Select,
  Popover,
} from "antd";
import {
  EyeOutlined,
  ReloadOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { useState, useEffect, useMemo } from "react";
import dayjs from "dayjs";
import client from "../api/client";

const { RangePicker } = DatePicker;

interface LogEntry {
  id: string;
  webhookName: string;
  webhookPath: string;
  method: string;
  headers: Record<string, string>;
  payload: Record<string, unknown> | null;
  statusCode: number;
  response: Record<string, unknown> | null;
  receivedAt: string;
}

interface DeleteConfirmModalProps {
  open: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}

const DeleteConfirmModal = ({
  open,
  title,
  description,
  onConfirm,
  onCancel,
  loading,
}: DeleteConfirmModalProps) => {
  const [inputValue, setInputValue] = useState("");
  const confirmText = "确认删除";

  const handleConfirm = () => {
    if (inputValue === confirmText) {
      onConfirm();
    } else {
      message.error("请输入正确的确认文字");
    }
  };

  const handleCancel = () => {
    setInputValue("");
    onCancel();
  };

  useEffect(() => {
    if (!open) {
      setInputValue("");
    }
  }, [open]);

  return (
    <Modal
      open={open}
      title={
        <span className="text-red-600">
          <ExclamationCircleOutlined className="mr-2" />
          {title}
        </span>
      }
      onOk={handleConfirm}
      onCancel={handleCancel}
      okText="确认删除"
      cancelText="取消"
      okButtonProps={{
        danger: true,
        disabled: inputValue !== confirmText,
        loading,
      }}
      destroyOnClose
    >
      <div className="space-y-4">
        <p className="text-gray-600">{description}</p>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600 text-sm mb-2">
            ⚠️ 此操作不可恢复！请输入「<strong>{confirmText}</strong>」以确认删除：
          </p>
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={`请输入"${confirmText}"`}
            className="mt-2"
          />
        </div>
      </div>
    </Modal>
  );
};

const History = () => {
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);

  // Delete modal states
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteModalConfig, setDeleteModalConfig] = useState({
    title: "",
    description: "",
    action: () => {},
  });

  // Batch delete by webhook modal
  const [webhookDeleteModalOpen, setWebhookDeleteModalOpen] = useState(false);
  const [selectedWebhookForDelete, setSelectedWebhookForDelete] = useState<string | null>(null);

  // Delete by date modal
  const [dateDeleteModalOpen, setDateDeleteModalOpen] = useState(false);
  const [deleteBeforeDate, setDeleteBeforeDate] = useState<dayjs.Dayjs | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await client.get("/logs");
      setLogs(response.data);
      setSelectedRowKeys([]);
    } catch (error) {
      message.error("获取日志失败");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleRefresh = () => {
    fetchLogs();
    message.success("日志已刷新");
  };

  const handleViewDetail = (log: LogEntry) => {
    setSelectedLog(log);
    setIsDrawerOpen(true);
  };

  // Get unique webhook names for filtering
  const uniqueWebhooks = useMemo(() => {
    const map = new Map<string, { name: string; path: string }>();
    logs.forEach((log) => {
      if (!map.has(log.webhookPath)) {
        map.set(log.webhookPath, { name: log.webhookName, path: log.webhookPath });
      }
    });
    return Array.from(map.values());
  }, [logs]);

  // Delete single log
  const handleDeleteSingle = (logId: string) => {
    setDeleteModalConfig({
      title: "删除单条日志",
      description: "您确定要删除这条日志记录吗？",
      action: async () => {
        setDeleteLoading(true);
        try {
          await client.delete(`/logs/${logId}`);
          message.success("删除成功");
          setDeleteModalOpen(false);
          fetchLogs();
        } catch (error) {
          message.error("删除失败");
        } finally {
          setDeleteLoading(false);
        }
      },
    });
    setDeleteModalOpen(true);
  };

  // Delete selected logs
  const handleDeleteSelected = () => {
    if (selectedRowKeys.length === 0) {
      message.warning("请先选择要删除的日志");
      return;
    }
    setDeleteModalConfig({
      title: `批量删除 ${selectedRowKeys.length} 条日志`,
      description: `您选择了 ${selectedRowKeys.length} 条日志记录，确定要全部删除吗？`,
      action: async () => {
        setDeleteLoading(true);
        try {
          const response = await client.post("/logs/delete-batch", { ids: selectedRowKeys });
          message.success(`成功删除 ${response.data.deletedCount} 条日志`);
          setDeleteModalOpen(false);
          fetchLogs();
        } catch (error) {
          message.error("删除失败");
        } finally {
          setDeleteLoading(false);
        }
      },
    });
    setDeleteModalOpen(true);
  };

  // Show webhook delete modal
  const showWebhookDeleteModal = () => {
    setWebhookDeleteModalOpen(true);
  };

  // Confirm delete by webhook
  const handleConfirmWebhookDelete = () => {
    if (!selectedWebhookForDelete) {
      message.warning("请选择要删除日志的 Webhook");
      return;
    }
    const webhook = uniqueWebhooks.find((w) => w.path === selectedWebhookForDelete);
    setWebhookDeleteModalOpen(false);
    setDeleteModalConfig({
      title: `删除 "${webhook?.name}" 的所有日志`,
      description: `您确定要删除 Webhook "${webhook?.name}" 的所有日志记录吗？这将删除该 Webhook 下的全部历史记录。`,
      action: async () => {
        setDeleteLoading(true);
        try {
          // Need to get webhookId from logs
          const webhookLog = logs.find((l) => l.webhookPath === selectedWebhookForDelete);
          if (!webhookLog) {
            message.error("未找到对应的 Webhook");
            return;
          }
          // Use batch delete for logs with this webhook path
          const idsToDelete = logs
            .filter((l) => l.webhookPath === selectedWebhookForDelete)
            .map((l) => l.id);
          const response = await client.post("/logs/delete-batch", { ids: idsToDelete });
          message.success(`成功删除 ${response.data.deletedCount} 条日志`);
          setDeleteModalOpen(false);
          setSelectedWebhookForDelete(null);
          fetchLogs();
        } catch (error) {
          message.error("删除失败");
        } finally {
          setDeleteLoading(false);
        }
      },
    });
    setDeleteModalOpen(true);
  };

  // Show date delete modal
  const showDateDeleteModal = () => {
    setDateDeleteModalOpen(true);
  };

  // Confirm delete by date
  const handleConfirmDateDelete = () => {
    if (!deleteBeforeDate) {
      message.warning("请选择日期");
      return;
    }
    setDateDeleteModalOpen(false);
    const formattedDate = deleteBeforeDate.format("YYYY-MM-DD HH:mm:ss");
    setDeleteModalConfig({
      title: `删除 ${formattedDate} 之前的日志`,
      description: `您确定要删除 ${formattedDate} 之前的所有日志记录吗？`,
      action: async () => {
        setDeleteLoading(true);
        try {
          const response = await client.post("/logs/delete-before-date", {
            beforeDate: deleteBeforeDate.toISOString(),
          });
          message.success(`成功删除 ${response.data.deletedCount} 条日志`);
          setDeleteModalOpen(false);
          setDeleteBeforeDate(null);
          fetchLogs();
        } catch (error) {
          message.error("删除失败");
        } finally {
          setDeleteLoading(false);
        }
      },
    });
    setDeleteModalOpen(true);
  };

  const columns = [
    {
      title: "时间",
      dataIndex: "receivedAt",
      key: "receivedAt",
      render: (text: string) => dayjs(text).format("YYYY-MM-DD HH:mm:ss"),
    },
    {
      title: "Webhook 名称",
      dataIndex: "webhookName",
      key: "webhookName",
    },
    {
      title: "路径",
      dataIndex: "webhookPath",
      key: "webhookPath",
      render: (path: string) => (
        <span className="font-mono text-sm text-gray-600">/{path}</span>
      ),
    },
    {
      title: "请求方法",
      dataIndex: "method",
      key: "method",
      render: (method: string) => (
        <Tag color={method === "GET" ? "blue" : method === "POST" ? "green" : "orange"}>
          {method}
        </Tag>
      ),
    },
    {
      title: "状态",
      dataIndex: "statusCode",
      key: "statusCode",
      render: (statusCode: number) => (
        <Tag color={statusCode < 400 ? "success" : "error"}>
          {statusCode} {statusCode < 400 ? "成功" : "失败"}
        </Tag>
      ),
    },
    {
      title: "操作",
      key: "actions",
      render: (_: unknown, record: LogEntry) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            查看
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteSingle(record.id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  const successCount = logs.filter((l) => l.statusCode < 400).length;
  const failedCount = logs.filter((l) => l.statusCode >= 400).length;

  const stats = [
    {
      label: "总请求数",
      value: logs.length,
      color: "#3b82f6",
    },
    {
      label: "成功请求",
      value: successCount,
      color: "#22c55e",
    },
    {
      label: "失败请求",
      value: failedCount,
      color: "#ef4444",
    },
    {
      label: "成功率",
      value: logs.length > 0 ? `${Math.round((successCount / logs.length) * 100)}%` : "N/A",
      color: "#8b5cf6",
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => {
      setSelectedRowKeys(keys as string[]);
    },
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="page-header flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-primary m-0">历史记录</h1>
          <p className="text-secondary m-0 mt-1">
            查看所有 Webhook 请求的历史日志
          </p>
        </div>
        <Space wrap>
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

      {/* 批量操作栏 */}
      <Card bordered={false} className="mb-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Space wrap>
            <span className="text-gray-600">
              已选择 <strong>{selectedRowKeys.length}</strong> 条记录
            </span>
            <Button
              danger
              icon={<DeleteOutlined />}
              disabled={selectedRowKeys.length === 0}
              onClick={handleDeleteSelected}
            >
              批量删除
            </Button>
          </Space>
          <Space wrap>
            <Popover
              content={
                <div className="w-64 space-y-3">
                  <p className="text-gray-500 text-sm">选择要删除日志的 Webhook：</p>
                  <Select
                    placeholder="选择 Webhook"
                    className="w-full"
                    value={selectedWebhookForDelete}
                    onChange={setSelectedWebhookForDelete}
                    options={uniqueWebhooks.map((w) => ({
                      label: w.name,
                      value: w.path,
                    }))}
                  />
                  <Button
                    danger
                    block
                    onClick={handleConfirmWebhookDelete}
                    disabled={!selectedWebhookForDelete}
                  >
                    确认删除
                  </Button>
                </div>
              }
              title="按 Webhook 删除"
              trigger="click"
              open={webhookDeleteModalOpen}
              onOpenChange={setWebhookDeleteModalOpen}
            >
              <Button danger type="dashed">
                按 Webhook 删除
              </Button>
            </Popover>
            <Popover
              content={
                <div className="w-64 space-y-3">
                  <p className="text-gray-500 text-sm">删除指定日期之前的所有日志：</p>
                  <DatePicker
                    showTime
                    placeholder="选择日期时间"
                    className="w-full"
                    value={deleteBeforeDate}
                    onChange={setDeleteBeforeDate}
                  />
                  <Button
                    danger
                    block
                    onClick={handleConfirmDateDelete}
                    disabled={!deleteBeforeDate}
                  >
                    确认删除
                  </Button>
                </div>
              }
              title="按日期删除"
              trigger="click"
              open={dateDeleteModalOpen}
              onOpenChange={setDateDeleteModalOpen}
            >
              <Button danger type="dashed">
                按日期删除
              </Button>
            </Popover>
          </Space>
        </div>
      </Card>

      {/* 表格 */}
      <Card bordered={false}>
        {loading && logs.length === 0 ? (
          <div className="flex justify-center items-center py-12">
            <Spin size="large" />
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={logs}
            rowKey="id"
            loading={loading}
            rowSelection={rowSelection}
            pagination={{
              pageSize: 10,
              showTotal: (total) => `共 ${total} 条记录`,
            }}
            scroll={{ x: 900 }}
            locale={{ emptyText: "暂无日志记录" }}
          />
        )}
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
                <span className="font-mono text-sm">{selectedLog.id}</span>
              </Descriptions.Item>
              <Descriptions.Item label="Webhook 名称">
                {selectedLog.webhookName}
              </Descriptions.Item>
              <Descriptions.Item label="路径">
                <span className="font-mono">/{selectedLog.webhookPath}</span>
              </Descriptions.Item>
              <Descriptions.Item label="时间">
                {dayjs(selectedLog.receivedAt).format("YYYY-MM-DD HH:mm:ss")}
              </Descriptions.Item>
              <Descriptions.Item label="请求方法">
                <Tag color={selectedLog.method === "POST" ? "green" : "blue"}>
                  {selectedLog.method}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="状态码">
                <Tag color={selectedLog.statusCode < 400 ? "success" : "error"}>
                  {selectedLog.statusCode}{" "}
                  {selectedLog.statusCode < 400 ? "成功" : "失败"}
                </Tag>
              </Descriptions.Item>
            </Descriptions>

            <div>
              <h4 className="text-primary font-medium mb-3">请求头</h4>
              <div className="code-block">
                <pre className="m-0 text-sm text-gray-700">
                  {JSON.stringify(selectedLog.headers, null, 2)}
                </pre>
              </div>
            </div>

            <div>
              <h4 className="text-primary font-medium mb-3">请求体</h4>
              <div className="code-block">
                <pre className="m-0 text-sm text-gray-700">
                  {selectedLog.payload
                    ? JSON.stringify(selectedLog.payload, null, 2)
                    : "无请求体"}
                </pre>
              </div>
            </div>

            <div>
              <h4 className="text-primary font-medium mb-3">响应体</h4>
              <div className="code-block">
                <pre className="m-0 text-sm text-gray-700">
                  {selectedLog.response
                    ? JSON.stringify(selectedLog.response, null, 2)
                    : "无响应内容"}
                </pre>
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* 二次确认删除弹窗 */}
      <DeleteConfirmModal
        open={deleteModalOpen}
        title={deleteModalConfig.title}
        description={deleteModalConfig.description}
        onConfirm={deleteModalConfig.action}
        onCancel={() => setDeleteModalOpen(false)}
        loading={deleteLoading}
      />
    </div>
  );
};

export default History;
