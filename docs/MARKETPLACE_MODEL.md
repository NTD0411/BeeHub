# UniMove Marketplace — mô hình dịch vụ

## Combo chuyển trọ (xe + khuân vác)

Gộp **vận chuyển nhà xe đối tác** và **đội khuân vác** trong một lựa chọn. Sinh viên chọn quy mô combo, có thể thêm người khuân vác với giá ưu đãi so với thuê riêng.

| Combo | Giá từ | Khuân vác kèm | Thêm 1 người (combo) | Thuê riêng (tham chiếu) |
|-------|--------|---------------|----------------------|-------------------------|
| Combo nhẹ | 199.000đ | 1 | +65.000đ | ~120.000đ |
| Combo phòng trọ | 450.000đ | 2 | +75.000đ | ~120.000đ |
| Combo trọn gói | 890.000đ | 3 | +70.000đ | ~120.000đ |

**Luồng app (customer):** Home → **Combo chuyển trọ** → chọn combo → (tuỳ chọn) thêm 0/1/2 người → **Chọn nhà xe** → **Bảo hiểm đồ đạc** → Thanh toán.

## Bảo hiểm đồ đạc

| Gói | Phí | Bồi thường tối đa |
|-----|-----|-------------------|
| Không mua | 0đ | — |
| Cơ bản | 35.000đ | 10 triệu |
| Tiêu chuẩn (khuyên dùng) | 75.000đ | 30 triệu |
| Toàn diện | 120.000đ | 50 triệu |

Lưu DB: `orders.has_insurance`, `orders.insurance_value` (mức bồi thường).

**Code:** `CargoInsurancePlan`, `insurance_selection_page.dart`, `BookingFlowState.insuranceFee`.

**Khuân vác đối tác** (thẻ nhỏ trên Home): thuê riêng, không gộp combo — `BookingServiceType.laborOnly`.

**Code tham chiếu:**

- Mock giá: `mobile/customer_app/lib/features/booking/data/booking_mock_repository.dart`
- UI combo: `service_packages_page.dart`
- State: `booking_flow_state.dart` (`extraComboLaborCount`, `comboExtraLaborFee`, `subtotal`)
