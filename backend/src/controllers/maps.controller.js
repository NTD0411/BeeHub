const mapsService = require('../services/maps.service');

async function autocomplete(req, res, next) {
  try {
    const input = req.query.input;
    const sessionToken = req.query.session_token;
    const data = await mapsService.autocomplete(input, sessionToken, {
      lat: req.query.lat,
      lng: req.query.lng,
      pickupAddress: req.query.pickup_address,
    });
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function placeDetails(req, res, next) {
  try {
    const placeId = req.query.place_id;
    const sessionToken = req.query.session_token;
    const address = req.query.address;
    const data = await mapsService.placeDetails(placeId, sessionToken, address);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function resolveAddress(req, res, next) {
  try {
    const data = await mapsService.resolveAddress(req.query.input, {
      lat: req.query.lat,
      lng: req.query.lng,
      pickupAddress: req.query.pickup_address,
    });
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  autocomplete,
  placeDetails,
  resolveAddress,
};
