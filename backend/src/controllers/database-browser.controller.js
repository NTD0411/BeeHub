const databaseBrowserService = require('../services/database-browser.service');

async function getTables(_req, res) {
  try {
    const tables = await databaseBrowserService.getTables();
    res.json({ success: true, data: tables });
  } catch (error) {
    console.error('Database browser tables error:', error);
    res.status(500).json({ success: false, message: 'Không thể tải danh sách bảng dữ liệu' });
  }
}

async function getTableSchema(req, res) {
  try {
    const columns = await databaseBrowserService.getColumns(req.params.table);
    res.json({ success: true, data: columns });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    console.error('Database browser schema error:', error);
    res.status(500).json({ success: false, message: 'Không thể tải cấu trúc bảng dữ liệu' });
  }
}

async function getTableRows(req, res) {
  try {
    const data = await databaseBrowserService.getRows({
      tableName: req.params.table,
      page: req.query.page,
      pageSize: req.query.pageSize,
      search: String(req.query.search || ''),
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder,
      filterColumn: req.query.filterColumn,
      filterValue: req.query.filterValue === undefined ? undefined : String(req.query.filterValue),
      filterMode: req.query.filterMode,
    });
    const { rows, total, page, pageSize, totalPages } = data;
    res.json({
      success: true,
      data: rows,
      meta: { total, page, pageSize, pages: totalPages },
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    console.error('Database browser rows error:', error);
    res.status(500).json({ success: false, message: 'Không thể tải dữ liệu bảng' });
  }
}

module.exports = { getTables, getTableSchema, getTableRows };
