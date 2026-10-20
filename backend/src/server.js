process.env.TZ = 'Asia/Ho_Chi_Minh';
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const os = require('os');
const app = require('./app');
const env = require('./config/env');
const { startOrderTimeoutJob } = require('./jobs/orderTimeout.job');

function lanAddresses() {
  const nets = os.networkInterfaces();
  const ips = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal) ips.push(net.address);
    }
  }
  return ips;
}

const server = app.listen(env.PORT, '0.0.0.0', () => {
  startOrderTimeoutJob();
  const payosOk = Boolean(env.PAYOS_CLIENT_ID && env.PAYOS_API_KEY && env.PAYOS_CHECKSUM_KEY);
  const goongOk = Boolean(env.GOONG_API_KEY);
  console.log(`UniMove API: http://localhost:${env.PORT}`);
  console.log(`Health: http://localhost:${env.PORT}/api/health`);
  console.log(`Web (Next.js): http://localhost:3001 — mở URL này trên trình duyệt`);
  console.log(`PayOS: ${payosOk ? 'đã cấu hình' : 'CHƯA cấu hình — lưu file .env ở thư mục gốc project'}`);
  console.log(`Goong: ${goongOk ? 'đã cấu hình' : 'CHƯA cấu hình — thêm GOONG_API_KEY vào .env (fallback OSM)'}`);
  const ips = lanAddresses();
  if (ips.length) {
    console.log('Điện thoại thật → api_config.dart useLanHost + IP:');
    ips.forEach((ip) => console.log(`  http://${ip}:${env.PORT}/api`));
  }
  console.log('Android emulator → http://10.0.2.2:' + env.PORT + '/api');
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${env.PORT} đang được sử dụng.`);
    console.error(`Tắt process đang chạy trên port ${env.PORT}, hoặc đổi PORT trong .env và NEXT_PUBLIC_API_URL cho khớp.`);
    process.exit(1);
  }
  throw error;
});
