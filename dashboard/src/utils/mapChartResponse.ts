export const mapChartResponse = (response: any) => {
  if (!response?.data){
     return [];
  }
  return response.data.map((item: any) => ({
    name: item.label,
    valor: parseFloat(item.value) || 0, 
  }));
};