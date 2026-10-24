const reviewsService = require('../services/reviews.service');

async function getMyReviews(req, res, next) {
  try {
    const data = await reviewsService.getProviderReviews(req.user.id);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function respondToReview(req, res, next) {
  try {
    const data = await reviewsService.respondToReview(
      req.params.id,
      req.user.id,
      req.body.response,
    );
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function submitReview(req, res, next) {
  try {
    const data = await reviewsService.createReview(req.user.id, req.params.orderId, req.body);
    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

module.exports = { getMyReviews, respondToReview, submitReview };
