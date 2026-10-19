# -*- coding: utf-8 -*-
"""Generate CUSTOMER_APP_API.csv — luồng người dùng kiểu kể chuyện cho dev."""
import csv
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from customer_api_narratives import NARRATIVES  # noqa: E402
from customer_api_sheet_data import BOOKING_FLOW, ENDPOINTS, PASS_FLOW  # noqa: E402

FIELDNAMES = [
    'STT',
    'Nhóm chức năng',
    'Mã BE',
    'Use Case',
    'Tên API',
    'Method',
    'Path đầy đủ',
    'Auth',
    'Trạng thái BE',
    'Luồng người dùng & mô tả API',
    'Flutter Repository',
    'Màn hình / Route Flutter',
    'Query params',
    'Request body',
    'Response data',
    'Mã lỗi HTTP',
    'Độ ưu tiên',
    'Ghi chú kỹ thuật (dev)',
]


def row_from_dict(d: dict) -> dict:
    stt = d['stt']
    story = NARRATIVES.get(stt, d.get('api_desc', ''))
    return {
        'STT': stt,
        'Nhóm chức năng': d['module'],
        'Mã BE': d['be'],
        'Use Case': d['uc'],
        'Tên API': d['title'],
        'Method': d['method'],
        'Path đầy đủ': d['path'],
        'Auth': d['auth'],
        'Trạng thái BE': d['status'],
        'Luồng người dùng & mô tả API': story,
        'Flutter Repository': d['repo'],
        'Màn hình / Route Flutter': d['screen'],
        'Query params': d['query'],
        'Request body': d['body'],
        'Response data': d['response'],
        'Mã lỗi HTTP': d['errors'],
        'Độ ưu tiên': d['priority'],
        'Ghi chú kỹ thuật (dev)': d['dev_task'],
    }


def main() -> None:
    docs = Path(__file__).resolve().parents[1]
    rows = [row_from_dict(PASS_FLOW), row_from_dict(BOOKING_FLOW)]
    rows.extend(row_from_dict(e) for e in ENDPOINTS)

    out_api = docs / 'CUSTOMER_APP_API.csv'
    with out_api.open('w', encoding='utf-8-sig', newline='') as f:
        w = csv.DictWriter(f, fieldnames=FIELDNAMES)
        w.writeheader()
        w.writerows(rows)

    implemented = sum(1 for e in ENDPOINTS if e['status'] == 'Đã có')
    pending = sum(1 for e in ENDPOINTS if e['status'] == 'Chưa có')
    pass_new = sum(1 for e in ENDPOINTS if 'Mới' in e['status'])

    summary = [
        ['Chỉ số', 'Giá trị'],
        ['Cách đọc file', 'Cột «Luồng người dùng & mô tả API» = người dùng làm gì → gọi API khi nào → xong thì sang bước nào'],
        ['Dòng đọc trước', 'F1 (Pass đồ), F2 (Đặt chuyến)'],
        ['Tổng API', str(len(ENDPOINTS))],
        ['Tổng dòng (gồm header)', str(len(rows) + 1)],
        ['Đã có backend', str(implemented)],
        ['Chưa có', str(pending)],
        ['Pass đồ mới', str(pass_new)],
        ['Sửa mô tả', 'docs/scripts/customer_api_narratives.py rồi chạy generate_customer_api_csv.py'],
    ]
    out_sum = docs / 'CUSTOMER_APP_API_TONG_HOP.csv'
    with out_sum.open('w', encoding='utf-8-sig', newline='') as f:
        csv.writer(f).writerows(summary)

    print(f'Wrote {len(rows)} rows -> {out_api.name}')
    print('Cot chinh: "Luong nguoi dung & mo ta API"')


if __name__ == '__main__':
    main()
