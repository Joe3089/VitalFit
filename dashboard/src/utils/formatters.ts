export type FormatType = "currency" | "number" | "percentage";

export const formatKPICardData = (data: any, type: FormatType = "currency") => {
  if (!data) {
    return null;
  }

  const rawValue = parseFloat(data.value) || 0;
  let displayValue = "";

  if (type === "currency") {
    displayValue = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(rawValue);
  } else if (type === "percentage") {
    displayValue = `${rawValue.toFixed(2)}%`;
  } else {

    displayValue = new Intl.NumberFormat("en-US").format(Math.floor(rawValue));
  }

  return {
    ...data,
    displayValue,
    displayTrend: Math.round(data.trend_percent || 0),
  };
};
