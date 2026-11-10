export const mapStatToCardProps = (apiResponse: any) => {
  const { data } = apiResponse;
  
  return {
    title: data.title,
    value: data.value, 
    trend: {
      value: Math.round(data.trend_percent),
      isPositive: data.is_positive,
      label: data.trend_label
    }
  };
};