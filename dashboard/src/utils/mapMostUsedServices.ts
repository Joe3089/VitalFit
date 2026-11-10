export const mapMostUsedServices = (data: any[]) => {
  return data.map((item) => ({
    serviceName: item.service_name || item.name || "Desconocido",
    usageCount: item.usage_count || item.count || 0,
  })).sort((a, b) => b.usageCount - a.usageCount); 
};