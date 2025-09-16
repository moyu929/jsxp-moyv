export const createServer = (options?: any) => {
  // 服务器实现
  console.log("createServer called with options:", options);
  return {
    start: () => Promise.resolve(),
    stop: () => Promise.resolve(),
  };
};
