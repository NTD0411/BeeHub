const { Pool } = require('pg');
const env = require('../config/env');

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 3,
});

const SENSITIVE_COLUMN = /(password|secret|token|credential|api[_-]?key|access[_-]?key|private[_-]?key|authorization|otp)/i;
const PAGE_SIZES = new Set([10, 25, 50, 100]);

function quoteIdentifier(identifier) {
  return `"${identifier.replace(/"/g, '""')}"`;
}

function isSensitive(columnName) {
  return SENSITIVE_COLUMN.test(columnName);
}

async function getTables() {
  const { rows } = await pool.query(`
    SELECT t.table_name AS name,
           obj_description(format('%I.%I', t.table_schema, t.table_name)::regclass) AS description
    FROM information_schema.tables t
    WHERE t.table_schema = 'public'
      AND t.table_type = 'BASE TABLE'
    ORDER BY t.table_name
  `);
  return rows;
}

async function getTable(tableName) {
  const { rows } = await pool.query(
    `SELECT table_name AS name
     FROM information_schema.tables
     WHERE table_schema = 'public'
       AND table_type = 'BASE TABLE'
       AND table_name = $1`,
    [tableName],
  );
  return rows[0] || null;
}

async function getColumns(tableName) {
  const table = await getTable(tableName);
  if (!table) {
    const error = new Error('Không tìm thấy bảng dữ liệu');
    error.status = 404;
    throw error;
  }

  const { rows } = await pool.query(
    `SELECT c.column_name AS name,
            c.data_type AS "dataType",
            c.udt_name AS "databaseType",
            c.is_nullable = 'YES' AS nullable,
            CASE
              WHEN c.column_name ~* $2 THEN NULL
              ELSE c.column_default
            END AS "defaultValue",
            EXISTS (
              SELECT 1
              FROM information_schema.key_column_usage k
              JOIN information_schema.table_constraints tc
                ON tc.constraint_catalog = k.constraint_catalog
               AND tc.constraint_schema = k.constraint_schema
               AND tc.constraint_name = k.constraint_name
               AND tc.table_schema = k.table_schema
               AND tc.table_name = k.table_name
              WHERE tc.constraint_type = 'PRIMARY KEY'
                AND k.table_schema = c.table_schema
                AND k.table_name = c.table_name
                AND k.column_name = c.column_name
            ) AS "isPrimaryKey",
            COALESCE((
              SELECT json_agg(json_build_object(
                'table', ref.table_name,
                'column', ref.column_name,
                'constraint', fk.constraint_name
              ))
              FROM information_schema.key_column_usage k
              JOIN information_schema.table_constraints fk
                ON fk.constraint_catalog = k.constraint_catalog
               AND fk.constraint_schema = k.constraint_schema
               AND fk.constraint_name = k.constraint_name
               AND fk.table_schema = k.table_schema
               AND fk.table_name = k.table_name
              JOIN information_schema.constraint_column_usage ref
                ON ref.constraint_catalog = fk.constraint_catalog
               AND ref.constraint_schema = fk.constraint_schema
               AND ref.constraint_name = fk.constraint_name
              WHERE fk.constraint_type = 'FOREIGN KEY'
                AND k.table_schema = c.table_schema
                AND k.table_name = c.table_name
                AND k.column_name = c.column_name
            ), '[]'::json) AS "foreignKeys",
            NOT (c.column_name ~* $2) AS searchable
     FROM information_schema.columns c
     WHERE c.table_schema = 'public'
       AND c.table_name = $1
     ORDER BY c.ordinal_position`,
    [tableName, SENSITIVE_COLUMN.source],
  );
  return rows;
}

async function getRows({
  tableName,
  page = 1,
  pageSize = 25,
  search = '',
  sortBy,
  sortOrder = 'desc',
  filterColumn,
  filterValue,
  filterMode = 'contains',
}) {
  const table = await getTable(tableName);
  if (!table) {
    const error = new Error('Không tìm thấy bảng dữ liệu');
    error.status = 404;
    throw error;
  }

  const parsedPage = Number(page);
  const parsedPageSize = Number(pageSize);
  if (!Number.isInteger(parsedPage) || parsedPage < 1 || parsedPage > 1000000) {
    const error = new Error('Số trang không hợp lệ');
    error.status = 400;
    throw error;
  }
  if (!PAGE_SIZES.has(parsedPageSize)) {
    const error = new Error('Số dòng mỗi trang phải là 10, 25, 50 hoặc 100');
    error.status = 400;
    throw error;
  }

  const columns = await getColumns(tableName);
  const searchableColumns = columns.filter((column) => column.searchable);
  const columnNames = new Set(columns.map((column) => column.name));
  if (sortOrder !== 'asc' && sortOrder !== 'desc') {
    const error = new Error('Thứ tự sắp xếp không hợp lệ');
    error.status = 400;
    throw error;
  }
  if (sortBy && !columnNames.has(sortBy)) {
    const error = new Error('Cột sắp xếp không hợp lệ');
    error.status = 400;
    throw error;
  }
  const conditions = [];
  const values = [];
  const addValue = (value) => {
    values.push(value);
    return `$${values.length}`;
  };

  if (search) {
    if (search.length > 200) {
      const error = new Error('Từ khóa tìm kiếm tối đa 200 ký tự');
      error.status = 400;
      throw error;
    }
    if (searchableColumns.length) {
      const parameter = addValue(`%${search}%`);
      conditions.push(
        `(${searchableColumns
          .map((column) => `CAST(${quoteIdentifier(column.name)} AS TEXT) ILIKE ${parameter}`)
          .join(' OR ')})`,
      );
    }
  }

  if (filterColumn && filterValue !== undefined && filterValue !== '') {
    const column = columns.find((item) => item.name === filterColumn);
    if (!column || !column.searchable) {
      const error = new Error('Cột lọc không hợp lệ');
      error.status = 400;
      throw error;
    }
    if (filterValue.length > 200) {
      const error = new Error('Giá trị lọc tối đa 200 ký tự');
      error.status = 400;
      throw error;
    }
    if (filterMode !== 'contains' && filterMode !== 'exact') {
      const error = new Error('Kiểu lọc không hợp lệ');
      error.status = 400;
      throw error;
    }
    const parameter = addValue(filterMode === 'contains' ? `%${filterValue}%` : filterValue);
    conditions.push(
      filterMode === 'contains'
        ? `CAST(${quoteIdentifier(column.name)} AS TEXT) ILIKE ${parameter}`
        : `CAST(${quoteIdentifier(column.name)} AS TEXT) = ${parameter}`,
    );
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const fromClause = `FROM public.${quoteIdentifier(tableName)}`;
  const countResult = await pool.query(
    `SELECT COUNT(*)::bigint AS total ${fromClause} ${whereClause}`,
    values,
  );

  const safeSortBy = sortBy || null;
  if (safeSortBy && !columns.find((column) => column.name === safeSortBy)?.searchable) {
    const error = new Error('Cột sắp xếp không hợp lệ');
    error.status = 400;
    throw error;
  }
  const orderClause = safeSortBy
    ? `ORDER BY ${quoteIdentifier(safeSortBy)} ${sortOrder === 'asc' ? 'ASC' : 'DESC'} NULLS LAST`
    : '';
  const offsetParameter = addValue((parsedPage - 1) * parsedPageSize);
  const limitParameter = addValue(parsedPageSize);
  const result = await pool.query(
    `SELECT * ${fromClause} ${whereClause} ${orderClause}
     LIMIT ${limitParameter} OFFSET ${offsetParameter}`,
    values,
  );

  const rows = result.rows.map((row) => {
    for (const column of columns) {
      if (isSensitive(column.name) && row[column.name] !== null) {
        row[column.name] = '[REDACTED]';
      }
    }
    return row;
  });

  return {
    rows,
    total: Number(countResult.rows[0].total),
    page: parsedPage,
    pageSize: parsedPageSize,
    totalPages: Math.ceil(Number(countResult.rows[0].total) / parsedPageSize),
  };
}

module.exports = { getTables, getColumns, getRows };
