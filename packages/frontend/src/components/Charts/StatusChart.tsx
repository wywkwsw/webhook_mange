import ReactECharts from "echarts-for-react";

interface StatusChartProps {
  data: { name: string; value: number }[];
  loading?: boolean;
}

export const StatusChart = ({ data, loading }: StatusChartProps) => {
  const option = {
    title: {
      text: "Status Distribution",
      left: "left",
    },
    tooltip: {
      trigger: "item",
    },
    legend: {
      orient: "vertical",
      left: "left",
      top: "bottom",
    },
    series: [
      {
        name: "Status",
        type: "pie",
        radius: "50%",
        data: data.map((item) => ({
          value: item.value,
          name: item.name,
          itemStyle: {
            color: item.name === "Success" ? "#52c41a" : "#ff4d4f",
          },
        })),
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: "rgba(0, 0, 0, 0.5)",
          },
        },
      },
    ],
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm">
      <ReactECharts
        option={option}
        style={{ height: "300px" }}
        showLoading={loading}
      />
    </div>
  );
};
