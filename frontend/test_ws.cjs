const WebSocket = require('ws');
const ws = new WebSocket('wss://204prod.vn/api/v1/notifications/ws/testuser');

ws.on('open', function open() {
  console.log('connected');
  ws.send('something');
});

ws.on('error', function error(err) {
  console.error('Error:', err.message);
});

ws.on('unexpected-response', (req, res) => {
  console.error('Unexpected response:', res.statusCode, res.statusMessage);
});
