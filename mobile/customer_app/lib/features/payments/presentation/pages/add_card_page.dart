import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/uni_move_colors.dart';

/// Thêm thẻ — nhập số thẻ hoặc quét (demo, lưu qua PayOS).
class AddCardPage extends StatefulWidget {
  const AddCardPage({super.key});

  @override
  State<AddCardPage> createState() => _AddCardPageState();
}

class _AddCardPageState extends State<AddCardPage> {
  final _controller = TextEditingController();
  bool _submitting = false;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  bool get _canContinue {
    final digits = _controller.text.replaceAll(RegExp(r'\D'), '');
    return digits.length >= 13;
  }

  void _showScanSheet() {
    final c = UniMoveColors.of(context);
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: c.surface,
      isScrollControlled: true,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20.r)),
      ),
      builder: (ctx) {
        return Padding(
          padding: EdgeInsets.fromLTRB(24.w, 12.h, 24.w, 32.h),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 40.w,
                height: 4.h,
                decoration: BoxDecoration(
                  color: c.border,
                  borderRadius: BorderRadius.circular(2.r),
                ),
              ),
              SizedBox(height: 20.h),
              Icon(Icons.credit_card_rounded, size: 72.sp, color: c.success),
              SizedBox(height: 16.h),
              Text(
                'Không cần nhập nữa. Quét để tự động điền thông tin thẻ.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 17.sp,
                  fontWeight: FontWeight.w800,
                  height: 1.35,
                  color: c.onSurface,
                ),
              ),
              SizedBox(height: 10.h),
              Text(
                'Đảm bảo thông tin thẻ hiển thị rõ khi quét. Bạn vẫn có thể chỉnh sửa sau khi quét xong.',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 14.sp, height: 1.45, color: c.onSurfaceMuted),
              ),
              SizedBox(height: 24.h),
              SizedBox(
                width: double.infinity,
                height: 48.h,
                child: FilledButton(
                  onPressed: () {
                    Navigator.pop(ctx);
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Quét thẻ sẽ tích hợp qua PayOS')),
                    );
                  },
                  style: FilledButton.styleFrom(
                    backgroundColor: c.success,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24.r)),
                  ),
                  child: const Text('Quét thẻ'),
                ),
              ),
              SizedBox(height: 10.h),
              SizedBox(
                width: double.infinity,
                height: 48.h,
                child: TextButton(
                  onPressed: () => Navigator.pop(ctx),
                  style: TextButton.styleFrom(
                    backgroundColor: c.chipBg,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24.r)),
                  ),
                  child: Text(
                    'Nhập thông tin theo cách thủ công',
                    style: TextStyle(
                      fontWeight: FontWeight.w600,
                      color: c.onSurface,
                    ),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Future<void> _continue() async {
    if (!_canContinue || _submitting) return;
    setState(() => _submitting = true);
    await Future<void>.delayed(const Duration(milliseconds: 600));
    if (!mounted) return;
    setState(() => _submitting = false);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Đã lưu thẻ — thanh toán qua PayOS khi đặt đơn')),
    );
    Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    final c = UniMoveColors.of(context);
    final bg = c.isLight(context) ? Colors.white : c.background;

    return Scaffold(
      backgroundColor: bg,
      appBar: AppBar(
        backgroundColor: bg,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new, color: c.onSurface, size: 20),
          onPressed: () => Navigator.of(context).maybePop(),
        ),
        title: Text(
          'Thêm thẻ',
          style: TextStyle(fontSize: 17.sp, fontWeight: FontWeight.w700, color: c.onSurface),
        ),
      ),
      body: ListView(
        padding: EdgeInsets.fromLTRB(20.w, 8.h, 20.w, 24.h),
        children: [
          Row(
            children: [
              Icon(Icons.shield_outlined, size: 16.sp, color: c.onSurface),
              SizedBox(width: 6.w),
              Text(
                'Số thẻ',
                style: TextStyle(fontSize: 14.sp, fontWeight: FontWeight.w600, color: c.onSurface),
              ),
            ],
          ),
          SizedBox(height: 8.h),
          TextField(
            controller: _controller,
            keyboardType: TextInputType.number,
            inputFormatters: [
              FilteringTextInputFormatter.digitsOnly,
              LengthLimitingTextInputFormatter(19),
              _CardNumberFormatter(),
            ],
            onChanged: (_) => setState(() {}),
            style: TextStyle(fontSize: 16.sp, color: c.onSurface),
            decoration: InputDecoration(
              hintText: 'Số thẻ',
              hintStyle: TextStyle(color: c.onSurfaceMuted),
              prefixIcon: Icon(Icons.credit_card_outlined, color: c.onSurfaceMuted),
              suffixIcon: IconButton(
                icon: Icon(Icons.photo_camera_outlined, color: c.onSurfaceMuted),
                onPressed: _showScanSheet,
              ),
              filled: true,
              fillColor: c.surfaceHigh,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10.r),
                borderSide: BorderSide(color: c.border),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10.r),
                borderSide: BorderSide(color: c.border),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10.r),
                borderSide: BorderSide(color: c.primary, width: 1.5),
              ),
            ),
          ),
          SizedBox(height: 12.h),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(Icons.shield_outlined, size: 18.sp, color: c.onSurfaceMuted),
              SizedBox(width: 8.w),
              Expanded(
                child: Text(
                  'Thông tin thẻ của bạn sẽ được lưu một cách an toàn qua PayOS.',
                  style: TextStyle(fontSize: 13.sp, height: 1.4, color: c.onSurfaceMuted),
                ),
              ),
            ],
          ),
          SizedBox(height: 16.h),
          Text(
            'Chúng tôi có thể tạm thu một khoản nhỏ để xác minh thẻ và hoàn lại ngay sau đó.',
            style: TextStyle(fontSize: 13.sp, height: 1.45, color: c.onSurfaceMuted),
          ),
          SizedBox(height: 8.h),
          Text.rich(
            TextSpan(
              style: TextStyle(fontSize: 13.sp, height: 1.45, color: c.onSurfaceMuted),
              children: [
                const TextSpan(text: 'Bằng việc thêm thẻ, bạn đồng ý với '),
                TextSpan(
                  text: 'điều khoản và điều kiện',
                  style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.w600),
                ),
                const TextSpan(text: ' của UniMove.'),
              ],
            ),
          ),
        ],
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: EdgeInsets.fromLTRB(20.w, 8.h, 20.w, 16.h),
          child: SizedBox(
            height: 48.h,
            child: FilledButton(
              onPressed: _canContinue && !_submitting ? _continue : null,
              style: FilledButton.styleFrom(
                backgroundColor: c.success,
                disabledBackgroundColor: c.border,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24.r)),
              ),
              child: _submitting
                  ? SizedBox(
                      width: 22.w,
                      height: 22.w,
                      child: const CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    )
                  : Text(
                      'Tiếp tục',
                      style: TextStyle(fontSize: 16.sp, fontWeight: FontWeight.w600),
                    ),
            ),
          ),
        ),
      ),
    );
  }
}

class _CardNumberFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(TextEditingValue oldValue, TextEditingValue newValue) {
    final digits = newValue.text.replaceAll(RegExp(r'\D'), '');
    final buf = StringBuffer();
    for (var i = 0; i < digits.length; i++) {
      if (i > 0 && i % 4 == 0) buf.write(' ');
      buf.write(digits[i]);
    }
    final text = buf.toString();
    return TextEditingValue(
      text: text,
      selection: TextSelection.collapsed(offset: text.length),
    );
  }
}
