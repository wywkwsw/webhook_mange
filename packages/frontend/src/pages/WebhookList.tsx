import { useState, useEffect, useRef } from "react";
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
  Radio,
  Alert,
  Dropdown,
} from "antd";
import type { MenuProps } from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CopyOutlined,
  LinkOutlined,
  SearchOutlined,
  SendOutlined,
  ExportOutlined,
  ImportOutlined,
  DownOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";
import { useWebhookStore } from "../store/webhookStore";
import WebhookForm from "../components/Webhooks/WebhookForm";
import type { Webhook, CreateWebhookDto, UpdateWebhookDto, WebhookExportData, ImportMode, ImportResult } from "../types/webhook";

const WebhookList = () => {
  const { webhooks, loading, fetchWebhooks, createWebhook, updateWebhook, deleteWebhook, exportWebhooks, importWebhooks } =
    useWebhookStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<Webhook | null>(null);
  const [searchText, setSearchText] = useState("");
  
  // 导入相关状态
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importData, setImportData] = useState<WebhookExportData | null>(null);
  const [importMode, setImportMode] = useState<ImportMode>("skip");
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 选中的 webhook（用于批量导出）
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);

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

  // 导出功能
  const handleExport = async (exportAll: boolean = true) => {
    try {
      const ids = exportAll ? undefined : selectedRowKeys;
      if (!exportAll && selectedRowKeys.length === 0) {
        message.warning("请先选择要导出的 Webhook");
        return;
      }
      const data = await exportWebhooks(ids);
      
      // 下载 JSON 文件
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `webhooks-export-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      message.success(`成功导出 ${data.webhooks.length} 个 Webhook 配置`);
    } catch {
      message.error("导出失败");
    }
  };

  // 导入功能 - 打开文件选择
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  // 处理文件选择
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content) as WebhookExportData;
        
        // 验证数据格式
        if (!data.version || !Array.isArray(data.webhooks)) {
          message.error("无效的配置文件格式");
          return;
        }
        
        setImportData(data);
        setImportResult(null);
        setIsImportModalOpen(true);
      } catch {
        message.error("无法解析配置文件，请确保是有效的 JSON 格式");
      }
    };
    reader.readAsText(file);
    
    // 重置 input 以便可以再次选择同一文件
    event.target.value = "";
  };

  // 执行导入
  const handleImportConfirm = async () => {
    if (!importData) return;
    
    setImporting(true);
    try {
      const result = await importWebhooks(importData, importMode);
      setImportResult(result);
      
      if (result.imported > 0 || result.overwritten > 0 || result.renamed > 0) {
        message.success(`导入完成：新增 ${result.imported}，覆盖 ${result.overwritten}，重命名 ${result.renamed}`);
        fetchWebhooks(); // 刷新列表
      } else if (result.skipped > 0) {
        message.info(`所有 ${result.skipped} 个 Webhook 已跳过（路径已存在）`);
      }
    } catch {
      message.error("导入失败");
    } finally {
      setImporting(false);
    }
  };

  // 导出菜单
  const exportMenuItems: MenuProps["items"] = [
    {
      key: "all",
      label: "导出全部",
      icon: <DownloadOutlined />,
      onClick: () => handleExport(true),
    },
    {
      key: "selected",
      label: `导出选中 (${selectedRowKeys.length})`,
      icon: <ExportOutlined />,
      onClick: () => handleExport(false),
      disabled: selectedRowKeys.length === 0,
    },
  ];

  // 表格行选择配置
  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => setSelectedRowKeys(keys as string[]),
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
      {/* 隐藏的文件输入 */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        accept=".json"
        onChange={handleFileSelect}
      />

      {/* 页面标题 */}
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-primary m-0">
            Webhook 管理
          </h1>
          <p className="text-secondary m-0 mt-1">管理和监控您的 Webhook 端点</p>
        </div>
        <Space>
          <Button icon={<ImportOutlined />} onClick={handleImportClick}>
            导入配置
          </Button>
          <Dropdown menu={{ items: exportMenuItems }}>
            <Button icon={<ExportOutlined />}>
              导出配置 <DownOutlined />
            </Button>
          </Dropdown>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            创建 Webhook
          </Button>
        </Space>
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
          rowSelection={rowSelection}
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

      {/* 导入配置模态框 */}
      <Modal
        title="导入 Webhook 配置"
        open={isImportModalOpen}
        onCancel={() => {
          setIsImportModalOpen(false);
          setImportData(null);
          setImportResult(null);
        }}
        footer={
          importResult ? (
            <Button onClick={() => {
              setIsImportModalOpen(false);
              setImportData(null);
              setImportResult(null);
            }}>
              关闭
            </Button>
          ) : (
            <Space>
              <Button onClick={() => setIsImportModalOpen(false)}>取消</Button>
              <Button type="primary" loading={importing} onClick={handleImportConfirm}>
                确认导入
              </Button>
            </Space>
          )
        }
        width={600}
      >
        {importData && !importResult && (
          <div className="space-y-4">
            <Alert
              message={`即将导入 ${importData.webhooks.length} 个 Webhook 配置`}
              description={`导出时间：${new Date(importData.exportedAt).toLocaleString()}`}
              type="info"
              showIcon
            />
            
            <div>
              <div className="mb-2 font-medium">导入模式：</div>
              <Radio.Group value={importMode} onChange={(e) => setImportMode(e.target.value)}>
                <Space direction="vertical">
                  <Radio value="skip">
                    <span className="font-medium">跳过冲突</span>
                    <span className="text-muted ml-2">- 如果路径已存在，跳过该配置</span>
                  </Radio>
                  <Radio value="overwrite">
                    <span className="font-medium">覆盖已有</span>
                    <span className="text-muted ml-2">- 如果路径已存在，覆盖现有配置</span>
                  </Radio>
                  <Radio value="rename">
                    <span className="font-medium">自动重命名</span>
                    <span className="text-muted ml-2">- 如果路径已存在，自动添加后缀</span>
                  </Radio>
                </Space>
              </Radio.Group>
            </div>

            <div>
              <div className="mb-2 font-medium">配置预览：</div>
              <div className="max-h-48 overflow-auto border rounded p-2" style={{ background: "var(--bg-surface)" }}>
                {importData.webhooks.map((w, i) => (
                  <div key={i} className="py-1 border-b last:border-b-0" style={{ borderColor: "var(--border-color)" }}>
                    <span className="font-medium">{w.name}</span>
                    <span className="text-muted ml-2">/{w.path}</span>
                    {w.forwardConfig?.enabled && (
                      <Tag color="cyan" className="ml-2" style={{ fontSize: 10 }}>转发</Tag>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {importResult && (
          <div className="space-y-4">
            <Alert
              message="导入完成"
              type={importResult.errors.length > 0 ? "warning" : "success"}
              showIcon
            />
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded" style={{ background: "var(--bg-surface)" }}>
                <div className="text-muted text-sm">总数</div>
                <div className="text-xl font-semibold">{importResult.total}</div>
              </div>
              <div className="p-3 rounded" style={{ background: "var(--bg-surface)" }}>
                <div className="text-muted text-sm">新增</div>
                <div className="text-xl font-semibold text-green-600">{importResult.imported}</div>
              </div>
              <div className="p-3 rounded" style={{ background: "var(--bg-surface)" }}>
                <div className="text-muted text-sm">覆盖</div>
                <div className="text-xl font-semibold text-blue-600">{importResult.overwritten}</div>
              </div>
              <div className="p-3 rounded" style={{ background: "var(--bg-surface)" }}>
                <div className="text-muted text-sm">重命名</div>
                <div className="text-xl font-semibold text-orange-600">{importResult.renamed}</div>
              </div>
              <div className="p-3 rounded" style={{ background: "var(--bg-surface)" }}>
                <div className="text-muted text-sm">跳过</div>
                <div className="text-xl font-semibold text-gray-500">{importResult.skipped}</div>
              </div>
              <div className="p-3 rounded" style={{ background: "var(--bg-surface)" }}>
                <div className="text-muted text-sm">错误</div>
                <div className="text-xl font-semibold text-red-600">{importResult.errors.length}</div>
              </div>
            </div>

            {importResult.errors.length > 0 && (
              <div>
                <div className="mb-2 font-medium text-red-600">错误详情：</div>
                <div className="max-h-32 overflow-auto border rounded p-2 border-red-200" style={{ background: "#fff5f5" }}>
                  {importResult.errors.map((err, i) => (
                    <div key={i} className="py-1 text-sm">
                      <span className="font-medium">{err.path}</span>: {err.error}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default WebhookList;
