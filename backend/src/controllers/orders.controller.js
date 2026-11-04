const ordersService = require('../services/orders.service');

async function create(req, res, next) {
  try {
    const data = await ordersService.createOrder(req.user.id, req.body || {});
    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function list(req, res, next) {
  try {
    const data = await ordersService.listOrders(req.user.id, req.user.role, req.query.status);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function get(req, res, next) {
  try {
    const data = await ordersService.getOrder(req.user.id, req.user.role, req.params.id);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function respond(req, res, next) {
  try {
    const data = await ordersService.respondToOrder(req.user.id, req.params.id, req.body || {});
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

module.exports = { create, list, get, respond };
