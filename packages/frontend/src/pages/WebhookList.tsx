import {
  Button,
  Table,
  Tag,
  Space,
  Popconfirm,
  Input,
  Modal,
  Switch,
  Form,
  message,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  LinkOutlined,
} from "@ant-design/icons";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useWebhookStore } from "../store/webhookStore";
import { WebhookForm } from "../components/Webhooks/WebhookForm";
import type {
  Webhook,
  CreateWebhookDto,
  UpdateWebhookDto,
} from "../types/webhook";

const WebhookList = () => {
  const {
    webhooks,
    loading,
    fetchWebhooks,
    createWebhook,
    updateWebhook,
    deleteWebhook,
  } = useWebhookStore();
  const [searchText, setSearchText] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<Webhook | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchWebhooks();
  }, [fetchWebhooks]);

  const handleCreate = () => {
    setEditingWebhook(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (webhook: Webhook) => {
    setEditingWebhook(webhook);
    form.setFieldsValue({
      ...webhook,
      status: webhook.status === "active",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
        status: values.status ? "active" : "inactive",
      };

      if (editingWebhook) {
        await updateWebhook(editingWebhook.id, payload as UpdateWebhookDto);
        message.success("Webhook updated successfully");
      } else {
        await createWebhook(payload as CreateWebhookDto);
        message.success("Webhook created successfully");
      }
      setIsModalOpen(false);
    } catch {
      // Form validation failed or API error handled by store
    }
  };

  const handleDelete = async (id: string) => {
    await deleteWebhook(id);
    message.success("Webhook deleted");
  };

  const handleStatusToggle = async (webhook: Webhook) => {
    const newStatus = webhook.status === "active" ? "inactive" : "active";
    await updateWebhook(webhook.id, { status: newStatus });
    message.success(`Webhook ${newStatus}`);
  };

  const filteredWebhooks = webhooks.filter(
    (w) =>
      w.name.toLowerCase().includes(searchText.toLowerCase()) ||
      w.url.toLowerCase().includes(searchText.toLowerCase()),
  );

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (text: string, record: Webhook) => (
        <Space direction="vertical" size={0}>
          <span className="font-medium">{text}</span>
          <span className="text-xs text-gray-400">{record.id}</span>
        </Space>
      ),
    },
    {
      title: "Method",
      dataIndex: "method",
      key: "method",
      width: 100,
      render: (method: string) => (
        <Tag
          color={
            method === "GET" ? "blue" : method === "POST" ? "green" : "orange"
          }
        >
          {method}
        </Tag>
      ),
    },
    {
      title: "URL",
      dataIndex: "url",
      key: "url",
      ellipsis: true,
      render: (url: string) => <span className="text-gray-600">{url}</span>,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (status: string, record: Webhook) => (
        <Switch
          checked={status === "active"}
          onChange={() => handleStatusToggle(record)}
          size="small"
        />
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 150,
      render: (_: any, record: Webhook) => (
        <Space>
          <Link to={`/webhooks/${record.id}`}>
            <Button type="text" size="small" icon={<LinkOutlined />} />
          </Link>
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="Delete Webhook"
            description="Are you sure to delete this webhook?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Webhooks</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          Create Webhook
        </Button>
      </div>

      <Input
        prefix={<SearchOutlined className="text-gray-400" />}
        placeholder="Search by name or URL..."
        className="max-w-md"
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
      />

      <Table
        columns={columns}
        dataSource={filteredWebhooks}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingWebhook ? "Edit Webhook" : "Create New Webhook"}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={() => setIsModalOpen(false)}
        confirmLoading={loading}
      >
        <WebhookForm form={form} initialValues={editingWebhook} />
      </Modal>
    </div>
  );
};

export default WebhookList;
