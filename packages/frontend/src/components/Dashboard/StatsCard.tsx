import { Card, Statistic } from "antd";
import type { ReactNode } from "react";

interface StatsCardProps {
  title: string;
  value: number | string;
  prefix?: ReactNode;
  suffix?: ReactNode;
  loading?: boolean;
  precision?: number;
  valueStyle?: React.CSSProperties;
}

export const StatsCard = ({
  title,
  value,
  prefix,
  suffix,
  loading = false,
  precision,
  valueStyle,
}: StatsCardProps) => {
  return (
    <Card bordered={false} loading={loading} className="shadow-sm">
      <Statistic
        title={title}
        value={value}
        precision={precision}
        valueStyle={valueStyle}
        prefix={prefix}
        suffix={suffix}
      />
    </Card>
  );
};
