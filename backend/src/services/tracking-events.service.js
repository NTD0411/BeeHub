const { EventEmitter } = require('node:events');
// Single API process. Events contain only an invalidation signal; clients must
// re-read the authorized endpoint to obtain any trip or location information.
const events = new EventEmitter();
events.setMaxListeners(0);
module.exports = {
  changed(orderId) { events.emit(orderId); },
  subscribe(orderId, callback) {
    events.on(orderId, callback);
    return () => events.off(orderId, callback);
  },
};
