interface FranchisePerformanceItemProps {
  name: string;
  status: string;
  revenue: number; 
  growth: number;
  trend?: "up" | "down" | "neutral"; 
  withBorder?: boolean;
}

export function FranchisePerformanceItem({
  name,
  status,
  revenue,
  growth,
  trend,
  withBorder = true,
}: FranchisePerformanceItemProps) {
  const isPositive = trend === "up";

  return (
    <div
      className={`flex items-center justify-between pb-4 ${
        withBorder ? "border-b" : ""
      }`}
    >
      <div>
        <p className="font-medium">{name}</p>
        <p className="text-sm text-gray-500">{status}</p>
      </div>

      <div className="text-right flex gap-2">
        <p className="font-semibold">${Number(revenue).toLocaleString()}</p>
        <p
          className={`text-sm ${
            isPositive ? "text-green-600" : "text-red-600"
          }`}
        >
          {isPositive ? "+" : ""}
          {growth.toFixed(1)}%
        </p>
      </div>
    </div>
  );
}
