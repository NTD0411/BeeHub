const { supabaseAdmin } = require('../services/supabase.service');
const orderQuotesService = require('../services/order_quotes.service');

async function getUserRole(userId) {
  const { data } = await supabaseAdmin.from('profiles').select('role').eq('id', userId).single();
  return data?.role || 'customer';
}

async function submitQuote(req, res, next) {
  try {
    const quote = await orderQuotesService.submitQuote(req.params.id, req.user.id, req.body);
    res.status(201).json({ success: true, data: quote });
  } catch (error) {
    next(error);
  }
}

async function listQuotes(req, res, next) {
  try {
    const role = await getUserRole(req.user.id);
    const result = await orderQuotesService.listQuotes(req.params.id, req.user.id, role);
    res.json({ success: true, data: result.quotes, order: result.order });
  } catch (error) {
    next(error);
  }
}

async function selectQuote(req, res, next) {
  try {
    const result = await orderQuotesService.selectQuote(
      req.params.id,
      req.params.quoteId,
      req.user.id,
    );
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

module.exports = { submitQuote, listQuotes, selectQuote };
