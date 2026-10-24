const { GoogleAuth } = require('google-auth-library');

const GA4_PROPERTY_ID = process.env.GA4_PROPERTY_ID;
const GA4_SERVICE_ACCOUNT_JSON = process.env.GA4_SERVICE_ACCOUNT_JSON;

function isConfigured() {
  return Boolean(GA4_PROPERTY_ID && GA4_SERVICE_ACCOUNT_JSON);
}

function parseCredentials() {
  if (!GA4_SERVICE_ACCOUNT_JSON) return null;
  try {
    return JSON.parse(GA4_SERVICE_ACCOUNT_JSON);
  } catch {
    return null;
  }
}

async function getAccessToken() {
  const credentials = parseCredentials();
  if (!credentials) {
    throw new Error('GA4_SERVICE_ACCOUNT_JSON không hợp lệ');
  }

  const auth = new GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
  });

  const client = await auth.getClient();
  const tokenResponse = await client.getAccessToken();
  if (!tokenResponse?.token) {
    throw new Error('Không lấy được access token GA4');
  }
  return tokenResponse.token;
}

async function runReport(body) {
  const token = await getAccessToken();
  const url = `https://analyticsdata.googleapis.com/v1beta/properties/${GA4_PROPERTY_ID}:runReport`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  if (!response.ok) {
    const message = data?.error?.message || 'GA4 Data API request failed';
    throw new Error(message);
  }
  return data;
}

function parseDimensionMetricRows(report, dimensionKeys, metricKeys) {
  const rows = report?.rows || [];
  return rows.map((row) => {
    const item = {};
    dimensionKeys.forEach((key, i) => {
      item[key] = row.dimensionValues?.[i]?.value ?? '';
    });
    metricKeys.forEach((key, i) => {
      item[key] = Number(row.metricValues?.[i]?.value ?? 0);
    });
    return item;
  });
}

const DATE_RANGE = [{ startDate: '30daysAgo', endDate: 'today' }];

async function getTrafficSources() {
  const report = await runReport({
    dateRanges: DATE_RANGE,
    dimensions: [{ name: 'sessionSource' }, { name: 'sessionMedium' }],
    metrics: [{ name: 'sessions' }, { name: 'activeUsers' }],
    orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
    limit: 15,
  });

  return parseDimensionMetricRows(
    report,
    ['source', 'medium'],
    ['sessions', 'activeUsers'],
  );
}

async function getTopPages() {
  const report = await runReport({
    dateRanges: DATE_RANGE,
    dimensions: [{ name: 'pagePath' }],
    metrics: [{ name: 'screenPageViews' }, { name: 'activeUsers' }],
    orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
    limit: 15,
  });

  return parseDimensionMetricRows(
    report,
    ['pagePath'],
    ['pageViews', 'activeUsers'],
  );
}

async function getTopEvents() {
  const report = await runReport({
    dateRanges: DATE_RANGE,
    dimensions: [{ name: 'eventName' }],
    metrics: [{ name: 'eventCount' }],
    orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
    limit: 20,
  });

  return parseDimensionMetricRows(report, ['eventName'], ['eventCount']);
}

async function getAdminPages() {
  const report = await runReport({
    dateRanges: DATE_RANGE,
    dimensions: [{ name: 'pagePath' }],
    metrics: [{ name: 'screenPageViews' }, { name: 'activeUsers' }],
    dimensionFilter: {
      filter: {
        fieldName: 'pagePath',
        stringFilter: { matchType: 'BEGINS_WITH', value: '/admin' },
      },
    },
    orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
    limit: 15,
  });

  return parseDimensionMetricRows(
    report,
    ['pagePath'],
    ['pageViews', 'activeUsers'],
  );
}

async function getGA4Dashboard() {
  if (!isConfigured()) {
    return {
      configured: false,
      message:
        'Chưa cấu hình GA4 Data API. Thêm GA4_PROPERTY_ID và GA4_SERVICE_ACCOUNT_JSON trên backend.',
    };
  }

  const [trafficSources, topPages, topEvents, adminPages] = await Promise.all([
    getTrafficSources(),
    getTopPages(),
    getTopEvents(),
    getAdminPages(),
  ]);

  return {
    configured: true,
    period: '30 ngày gần nhất',
    trafficSources,
    topPages,
    topEvents,
    adminPages,
  };
}

module.exports = {
  isConfigured,
  getGA4Dashboard,
};
