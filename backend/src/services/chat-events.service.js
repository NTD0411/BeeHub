const { EventEmitter } = require('node:events');
// Per-user invalidation signal for chat. Payload chỉ chứa định danh thread;
// client tự gọi lại API có kiểm tra quyền để lấy nội dung tin nhắn.
const events = new EventEmitter();
events.setMaxListeners(0);

module.exports = {
  notify(userIds, payload) {
    for (const id of new Set((userIds || []).filter(Boolean))) events.emit(String(id), payload);
  },
  subscribe(userId, callback) {
    const key = String(userId);
    events.on(key, callback);
    return () => events.off(key, callback);
  },
};

