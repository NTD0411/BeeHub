const express = require('express');
const sharedMoveController = require('../controllers/shared-move.controller');

const router = express.Router();
router.get('/price', sharedMoveController.estimate);

module.exports = router;
