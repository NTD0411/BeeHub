const { WebSocketServer, WebSocket } = require('ws');

/**
 * WebSocket realtime cho chat: /api/chat/ws
 * Client gửi frame đầu {type:'subscribe', token}. Server đẩy {type:'message', ...thread}
 * mỗi khi có tin nhắn mới liên quan tới user đó.
 */
function attachChatWebSocket(server, { events, verifyToken, allowedOrigins }) {
  const wss = new WebSocketServer({ noServer: true, maxPayload: 4096, perMessageDeflate: false });
  const upgrade = (req, socket, head) => {
    if (req.url?.split('?')[0] !== '/api/chat/ws') return;
    if (req.headers.origin && !allowedOrigins.includes(req.headers.origin)) {
      socket.end('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n'); return;
    }
    wss.handleUpgrade(req, socket, head, ws => wss.emit('connection', ws));
  };
  server.on('upgrade', upgrade);

  wss.on('connection', ws => {
    let token, unsubscribe, alive = true;
    const deadline = setTimeout(() => ws.close(4401, 'Authentication required'), 5000);
    const send = value => {
      if (ws.readyState !== WebSocket.OPEN) return;
      if (ws.bufferedAmount > 262144) { ws.close(4408, 'Slow connection'); return; }
      ws.send(JSON.stringify(value));
    };
    ws.on('message', bytes => {
      if (token) return;
      try {
        const message = JSON.parse(bytes.toString());
        if (message.type !== 'subscribe' || typeof message.token !== 'string') throw Error();
        const user = verifyToken(message.token);
        const userId = user.sub || user.id;
        token = message.token;
        clearTimeout(deadline);
        unsubscribe = events.subscribe(userId, payload => {
          try { verifyToken(token); } catch { ws.close(4401, 'Session expired'); return; }
          send({ type: 'message', ...payload });
        });
        send({ type: 'ready' });
      } catch { ws.close(4401, 'Invalid authentication'); }
    });
    ws.on('pong', () => { alive = true; });
    const heartbeat = setInterval(() => {
      if (!alive) { ws.terminate(); return; }
      alive = false; ws.ping();
    }, 25000);
    ws.on('error', () => {});
    ws.on('close', () => { clearTimeout(deadline); clearInterval(heartbeat); unsubscribe?.(); });
  });

  return () => { server.off('upgrade', upgrade); for (const ws of wss.clients) ws.terminate(); wss.close(); };
}

module.exports = { attachChatWebSocket };

