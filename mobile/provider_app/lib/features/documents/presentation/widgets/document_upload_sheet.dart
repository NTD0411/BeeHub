import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:shadcn_ui/shadcn_ui.dart';

import '../../../../core/theme/uni_move_colors.dart';
import '../../../../core/widgets/shad_screen_scope.dart';
import '../../domain/provider_document_models.dart';

/// Nộp / cập nhật một loại giấy tờ (mock chọn ảnh).
class DocumentUploadSheet extends StatefulWidget {
  const DocumentUploadSheet({super.key, required this.record});

  final ProviderDocumentRecord record;

  @override
  State<DocumentUploadSheet> createState() => _DocumentUploadSheetState();
}

class _DocumentUploadSheetState extends State<DocumentUploadSheet> {
  final _number = TextEditingController();
  final _expiry = TextEditingController();
  bool _picked = false;

  bool get _needsMeta =>
      widget.record.type == ProviderDocumentType.license ||
      widget.record.type == ProviderDocumentType.vehicleRegistration ||
      widget.record.type == ProviderDocumentType.insurance;

  @override
  void initState() {
    super.initState();
    _number.text = widget.record.documentNumber ?? '';
    if (widget.record.expiryDate != null) {
      final d = widget.record.expiryDate!;
      _expiry.text = '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')}/${d.year}';
    }
    _picked = widget.record.previewLabel != null;
  }

  @override
  void dispose() {
    _number.dispose();
    _expiry.dispose();
    super.dispose();
  }

  DateTime? _parseExpiry() {
    final parts = _expiry.text.split('/');
    if (parts.length != 3) return null;
    final d = int.tryParse(parts[0]);
    final m = int.tryParse(parts[1]);
    final y = int.tryParse(parts[2]);
    if (d == null || m == null || y == null) return null;
    return DateTime(y, m, d);
  }

  void _mockPick(String source) {
    setState(() => _picked = true);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Đã chọn ảnh từ $source (demo)')),
    );
  }

  void _submit() {
    if (!_picked) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Vui lòng tải ảnh giấy tờ')),
      );
      return;
    }
    if (_needsMeta && _number.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Nhập số giấy tờ')),
      );
      return;
    }
    Navigator.pop(context, (
      documentNumber: _number.text.trim().isEmpty ? null : _number.text.trim(),
      expiryDate: _parseExpiry(),
      previewLabel: '${widget.record.type.id}_${DateTime.now().millisecondsSinceEpoch}.jpg',
    ));
  }

  @override
  Widget build(BuildContext context) {
    final c = UniMoveColors.of(context);
    final type = widget.record.type;

    return ShadScreenScope(
      builder: (_, theme) {
        return Padding(
          padding: EdgeInsets.only(
            left: 20,
            right: 20,
            top: 16,
            bottom: MediaQuery.paddingOf(context).bottom + 20,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: c.onSurfaceMuted.withValues(alpha: 0.3),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Text(
                type.label,
                style: theme.textTheme.large.copyWith(fontWeight: FontWeight.w800, color: c.onSurface),
              ),
              const SizedBox(height: 6),
              Text(
                type.required ? 'Giấy tờ bắt buộc' : 'Giấy tờ bổ sung',
                style: theme.textTheme.small.copyWith(color: c.onSurfaceMuted),
              ),
              const SizedBox(height: 20),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () => _mockPick('máy ảnh'),
                      icon: Icon(LucideIcons.camera, size: 18, color: c.primaryLight),
                      label: const Text('Chụp ảnh'),
                      style: OutlinedButton.styleFrom(
                        minimumSize: const Size(0, 48),
                        side: BorderSide(color: c.border),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () => _mockPick('thư viện'),
                      icon: Icon(LucideIcons.image, size: 18, color: c.primaryLight),
                      label: const Text('Thư viện'),
                      style: OutlinedButton.styleFrom(
                        minimumSize: const Size(0, 48),
                        side: BorderSide(color: c.border),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Container(
                height: 120,
                decoration: BoxDecoration(
                  color: c.iconBgTertiary,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: _picked ? c.success.withValues(alpha: 0.5) : c.glassBorder,
                  ),
                ),
                child: Center(
                  child: _picked
                      ? Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(LucideIcons.circleCheck, color: c.success, size: 32),
                            const SizedBox(height: 8),
                            Text(
                              'Ảnh đã chọn',
                              style: theme.textTheme.small.copyWith(
                                color: c.success,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ],
                        )
                      : Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(LucideIcons.upload, color: c.onSurfaceMuted, size: 28),
                            const SizedBox(height: 8),
                            Text(
                              'Ảnh rõ nét, đủ 4 góc, không che khuất',
                              style: theme.textTheme.small.copyWith(color: c.onSurfaceMuted),
                            ),
                          ],
                        ),
                ),
              ),
              if (_needsMeta) ...[
                const SizedBox(height: 16),
                Text('Số giấy tờ', style: theme.textTheme.small.copyWith(color: c.onSurfaceMuted)),
                const SizedBox(height: 8),
                ShadInput(
                  controller: _number,
                  placeholder: const Text('Nhập số trên giấy tờ'),
                  leading: const Icon(LucideIcons.hash, size: 18),
                ),
                const SizedBox(height: 12),
                Text('Ngày hết hạn (dd/mm/yyyy)', style: theme.textTheme.small.copyWith(color: c.onSurfaceMuted)),
                const SizedBox(height: 8),
                ShadInput(
                  controller: _expiry,
                  placeholder: const Text('VD: 01/08/2030'),
                  keyboardType: TextInputType.number,
                  inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'[0-9/]'))],
                  leading: const Icon(LucideIcons.calendar, size: 18),
                ),
              ],
              const SizedBox(height: 20),
              ShadButton(
                width: double.infinity,
                onPressed: _submit,
                child: const Text('Gửi giấy tờ'),
              ),
            ],
          ),
        );
      },
    );
  }
}
