import { useState, useEffect } from "react";
import {
  Table,
  Button,
  Space,
  Modal,
  Switch,
  message,
  Tag,
  Card,
  Input,
  Tooltip,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CopyOutlined,
  LinkOutlined,
  SearchOutlined,
  SendOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";
import { useWebhookStore } from "../store/webhookStore";
import WebhookForm from "../components/Webhooks/WebhookForm";
import type { Webhook, CreateWebhookDto, UpdateWebhookDto } from "../types/webhook";

const WebhookList = () => {
  const { webhooks, loading, fetchWebhooks, createWebhook, updateWebhook, deleteWebhook } =
    useWebhookStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<Webhook | null>(null);
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    fetchWebhooks();
  }, [fetchWebhooks]);

  const handleCreate = () => {
    setEditingWebhook(null);
    setIsModalOpen(true);
  };

  const handleEdit = (webhook: Webhook) => {
    setEditingWebhook(webhook);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    Modal.confirm({
      title: "确认删除",
      content: "确定要删除这个 Webhook 吗？此操作不可恢复。",
      okText: "删除",
      okType: "danger",
      cancelText: "取消",
      onOk: async () => {
        try {
          await deleteWebhook(id);
          message.success("删除成功");
        } catch {
          message.error("删除失败");
        }
      },
    });
  };

  const handleStatusChange = async (webhook: Webhook, checked: boolean) => {
    try {
      await updateWebhook(webhook.id, { isActive: checked });
      message.success(`Webhook 已${checked ? "启用" : "停用"}`);
    } catch {
      message.error("状态更新失败");
    }
  };

  const handleSubmit = async (values: CreateWebhookDto | UpdateWebhookDto) => {
    try {
      if (editingWebhook) {
        await updateWebhook(editingWebhook.id, values as UpdateWebhookDto);
        message.success("更新成功");
      } else {
        await createWebhook(values as CreateWebhookDto);
        message.success("创建成功");
      }
      setIsModalOpen(false);
    } catch {
      message.error(editingWebhook ? "更新失败" : "创建失败");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    message.success("已复制到剪贴板");
  };

  const filteredWebhooks = webhooks.filter(
    (w) =>
      w.name.toLowerCase().includes(searchText.toLowerCase()) ||
      w.path.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    {
      title: "名称",
      dataIndex: "name",
      key: "name",
      render: (name: string, record: Webhook) => (
        <div>
          <div className="font-medium">{name}</div>
          <div className="text-muted text-xs">{record.path}</div>
        </div>
      ),
    },
    {
      title: "接收地址",
      key: "endpoint",
      render: (_: unknown, record: Webhook) => (
        <div className="flex items-center gap-2">
          <code
            className="text-xs px-2 py-1 rounded"
            style={{
              background: "var(--bg-surface)",
              color: "var(--text-secondary)",
            }}
          >
            /hook/{record.path}
          </code>
          <Tooltip title="复制">
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined />}
              onClick={() =>
                copyToClipboard(`${window.location.origin}/hook/${record.path}`)
              }
            />
          </Tooltip>
        </div>
      ),
    },
    {
      title: "密钥",
      dataIndex: "secret",
      key: "secret",
      render: (secret: string | null) => (
        <span className="text-secondary">{secret ? "已设置" : "无"}</span>
      ),
    },
    {
      title: "转发",
      key: "forward",
      render: (_: unknown, record: Webhook) => (
        record.forwardConfig?.enabled ? (
          <Tooltip title={record.forwardConfig.targetUrl}>
            <Tag icon={<SendOutlined />} color="cyan">
              已配置
            </Tag>
          </Tooltip>
        ) : (
          <span className="text-muted">未配置</span>
        )
      ),
    },
    {
      title: "状态",
      dataIndex: "isActive",
      key: "isActive",
      render: (isActive: boolean, record: Webhook) => (
        <Switch
          checked={isActive}
          onChange={(checked) => handleStatusChange(record, checked)}
          size="small"
        />
      ),
    },
    {
      title: "操作",
      key: "actions",
      render: (_: unknown, record: Webhook) => (
        <Space>
          <Tooltip title="详情">
            <Link to={`/webhooks/${record.id}`}>
              <Button type="text" size="small" icon={<LinkOutlined />} />
            </Link>
          </Tooltip>
          <Tooltip title="复制 URL">
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined />}
              onClick={() =>
                copyToClipboard(`${window.location.origin}/hook/${record.path}`)
              }
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip title="删除">
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record.id)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-primary m-0">
            Webhook 管理
          </h1>
          <p className="text-secondary m-0 mt-1">管理和监控您的 Webhook 端点</p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          创建 Webhook
        </Button>
      </div>

      {/* 搜索和表格 */}
      <Card bordered={false}>
        <div className="mb-4">
          <Input
            placeholder="搜索名称或路径..."
            prefix={<SearchOutlined style={{ color: "var(--text-muted)" }} />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ maxWidth: 300 }}
            allowClear
          />
        </div>
        <Table
          columns={columns}
          dataSource={filteredWebhooks}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showTotal: (total) => `共 ${total} 条`,
          }}
        />
      </Card>

      {/* 创建/编辑模态框 */}
      <Modal
        title={editingWebhook ? "编辑 Webhook" : "创建 Webhook"}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        destroyOnClose
        width={600}
      >
        <WebhookForm
          initialValues={
            editingWebhook
              ? {
                  name: editingWebhook.name,
                  path: editingWebhook.path,
                  secret: editingWebhook.secret || undefined,
                  isActive: editingWebhook.isActive,
                  forwardConfig: editingWebhook.forwardConfig || undefined,
                }
              : undefined
          }
          onSubmit={handleSubmit}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
};

export default WebhookList;
