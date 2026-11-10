export const reportFetcher = async (promise: Promise<any>) => {
  const response = await promise;
  return response.data; 
};