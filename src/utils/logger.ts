const getTimestamp = () => {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  
  const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const time = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  
  return `${date} ${time}`;
};

export const logger = {
  info: (msg: string) => console.log(`${getTimestamp()} [INFO] ${msg}`),
  warn: (msg: string) => console.log(`${getTimestamp()} [WARN] ${msg}`),
  error: (msg: string) => console.error(`${getTimestamp()} [ERROR] ${msg}`),
};
