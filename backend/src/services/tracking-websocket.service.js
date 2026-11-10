const { WebSocketServer, WebSocket } = require('ws');

function attachTrackingWebSocket(server, { service, events, verifyToken, db, allowedOrigins }) {
  const wss = new WebSocketServer({ noServer: true, maxPayload: 8192, perMessageDeflate: false });
  const upgrade = (req, socket, head) => {
    if (req.url?.split('?')[0] !== '/api/orders/tracking/ws') return;
    if (req.headers.origin && !allowedOrigins.includes(req.headers.origin)) {
      socket.end('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n'); return;
    }
    wss.handleUpgrade(req, socket, head, ws => wss.emit('connection', ws));
  };
  server.on('upgrade', upgrade);
  wss.on('connection', ws => {
    let token, orderId, unsubscribe, refreshing = false, dirty = false, alive = true;
    const deadline = setTimeout(() => ws.close(4401, 'Authentication required'), 5000);
    const send = value => { if (ws.readyState === WebSocket.OPEN) {
      if (ws.bufferedAmount > 262144) { ws.close(4408, 'Slow connection'); return; }
      ws.send(JSON.stringify(value));
    }};
    async function refresh() {
      if (refreshing) { dirty = true; return; }
      if (!token || ws.readyState !== WebSocket.OPEN) return;
      refreshing = true;
      try {
        let user;
        try { user = verifyToken(token); } catch { ws.close(4401, 'Session expired'); return; }
        const {data:profile,error} = await db.from('profiles').select('role,status').eq('id',user.sub).maybeSingle();
        if(error) throw Object.assign(new Error('Unavailable'),{status:503});
        if(!profile || !['customer','provider'].includes(profile.role) || ['inactive','suspended'].includes(profile.status)) {
          ws.close(4403, 'Access denied'); return;
        }
        const snapshot = await service.read(orderId, {id:user.sub,role:profile.role});
        send({type:'snapshot',data:snapshot});
      } catch(err) {
        if([400,403,404].includes(err.status)) ws.close(4403,'Access denied');
        else send({type:'unavailable'});
      } finally {
        refreshing = false;
        if(dirty) { dirty=false; void refresh(); }
      }
    }
    ws.on('message', bytes => {
      if (token) { ws.close(4400,'Already subscribed'); return; }
      try {
        const message = JSON.parse(bytes.toString());
        if(message.type!=='subscribe' || typeof message.token!=='string' || typeof message.order_id!=='string') throw Error();
        verifyToken(message.token);
        token=message.token;orderId=message.order_id;
        clearTimeout(deadline);
        unsubscribe=events.subscribe(orderId,()=>void refresh());
        void refresh();
      } catch { ws.close(4401,'Invalid authentication'); }
    });
    ws.on('pong',()=>{alive=true;});
    const heartbeat=setInterval(()=>{
      if(!alive){ws.terminate();return;}alive=false;ws.ping();void refresh();
    },15000);
    ws.on('error',()=>{});
    ws.on('close',()=>{clearTimeout(deadline);clearInterval(heartbeat);unsubscribe?.();});
  });
  return () => { server.off('upgrade',upgrade);for(const ws of wss.clients)ws.terminate();wss.close(); };
}
module.exports={attachTrackingWebSocket};
