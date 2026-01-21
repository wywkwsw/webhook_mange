import ReactECharts from "echarts-for-react";

interface RequestChartProps {
  data: { date: string; count: number }[];
  loading?: boolean;
}

export const RequestChart = ({ data, loading }: RequestChartProps) => {
  const option = {
    title: {
      text: "Request Trend (Last 7 Days)",
      left: "left",
    },
    tooltip: {
      trigger: "axis",
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: data.map((item) => item.date),
    },
    yAxis: {
      type: "value",
    },
    series: [
      {
        name: "Requests",
        type: "line",
        smooth: true,
        data: data.map((item) => item.count),
        areaStyle: {
          opacity: 0.3,
        },
        itemStyle: {
          color: "#3b82f6",
        },
      },
    ],
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm">
      <ReactECharts
        option={option}
        style={{ height: "350px" }}
        showLoading={loading}
      />
    </div>
  );
};
