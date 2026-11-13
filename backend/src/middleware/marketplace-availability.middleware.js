function createMarketplaceAvailability(db) {
  async function isEnabled() {
    const { data, error } = await db.from('platform_settings')
      .select('value').eq('key', 'marketplace_enabled').maybeSingle();
    if (error) throw error;
    if (!data) return true; // Existing deployments remain open until an admin switches off.
    return data.value === true || data.value === 'true' || data.value === 1 || data.value === '1';
  }
  function unavailable(res) {
    return res.status(503).json({ success: false, code: 'marketplace_status_unavailable', message: 'Không thể kiểm tra trạng thái Pass đồ. Vui lòng thử lại.' });
  }
  return {
    async status(_req, res) {
      res.set('Cache-Control', 'no-store');
      try { return res.json({ success: true, data: { enabled: await isEnabled() } }); }
      catch { return unavailable(res); }
    },
    async requireEnabled(_req, res, next) {
      try {
        if (!await isEnabled()) return res.status(503).json({ success: false, code: 'marketplace_disabled', message: 'Dịch vụ này đang đóng. Vui lòng quay lại sau.' });
        return next();
      } catch { return unavailable(res); }
    },
  };
}
module.exports = { createMarketplaceAvailability };
