import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:shadcn_ui/shadcn_ui.dart';

import '../../../../core/theme/uni_move_colors.dart';
import '../../../../core/widgets/shad_screen_scope.dart';
import '../../data/pass_item_repository.dart';
import '../../domain/pass_extras.dart';
import '../../domain/pass_item.dart';
import '../../domain/pass_item_provinces.dart';
import '../pass_item_format.dart';
import '../widgets/listing_fee_payment_sheet.dart';
import '../widgets/pass_item_image.dart';

class CreatePassItemPage extends StatefulWidget {
  const CreatePassItemPage({super.key});

  @override
  State<CreatePassItemPage> createState() => _CreatePassItemPageState();
}

class _CreatePassItemPageState extends State<CreatePassItemPage> {
  final _repo = PassItemRepository();
  final _picker = ImagePicker();
  final _titleCtrl = TextEditingController();
  final _priceCtrl = TextEditingController();
  final _usageCtrl = TextEditingController();
  final _areaCtrl = TextEditingController();
  final _descCtrl = TextEditingController();

  String _category = PassItemCategories.all.first;
  final String _provinceId = 'dn';
  PassItemCondition _condition = PassItemCondition.good;
  final List<String> _imagePaths = [];
  bool _free = false;
  bool _negotiable = false;
  bool _submitting = false;

  String get _fullArea =>
      PassItemProvince.formatArea(detail: _areaCtrl.text.trim(), provinceId: _provinceId);

  @override
  void dispose() {
    _titleCtrl.dispose();
    _priceCtrl.dispose();
    _usageCtrl.dispose();
    _areaCtrl.dispose();
    _descCtrl.dispose();
    super.dispose();
  }

  bool get _hasImage => _imagePaths.isNotEmpty;

  String? get _previewImage => _imagePaths.isNotEmpty ? _imagePaths.first : null;

  bool get _valid =>
      _hasImage &&
      _titleCtrl.text.trim().isNotEmpty &&
      _areaCtrl.text.trim().isNotEmpty &&
      (_free || (int.tryParse(_priceCtrl.text.trim()) ?? 0) > 0);

  int get _currentPrice => _free ? 0 : (int.tryParse(_priceCtrl.text.trim()) ?? 0);

  int get _listingFee => PassListingFee.compute(price: _currentPrice, isFree: _free);

  Future<void> _confirmAndSubmit() async {
    if (!_valid || _submitting) return;
    final c = UniMoveColors.of(context);
    final ok = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: c.surface,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => _feeSheet(ctx, c),
    );
    if (ok == true) _submit();
  }

  Widget _feeSheet(BuildContext ctx, UniMoveColors c) {
    final fee = _listingFee;
    return Padding(
      padding: EdgeInsets.fromLTRB(20, 14, 20, 20 + MediaQuery.of(ctx).padding.bottom),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(
            child: Container(
              width: 44,
              height: 5,
              decoration: BoxDecoration(color: c.border, borderRadius: BorderRadius.circular(999)),
            ),
          ),
          const SizedBox(height: 14),
          Text('Phí đăng tin', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: c.onSurface)),
          const SizedBox(height: 4),
          Text(PassListingFee.rateLabel, style: TextStyle(fontSize: 12, color: c.onSurfaceMuted)),
          const SizedBox(height: 16),
          _feeRow(c, 'Loại tin', _free ? 'Cho tặng miễn phí' : 'Bán đồ cũ'),
          if (!_free) _feeRow(c, 'Giá bán', _money(_currentPrice)),
          const Divider(height: 22),
          Row(
            children: [
              Text('Phí đăng tin', style: TextStyle(fontWeight: FontWeight.w700, color: c.onSurface)),
              const Spacer(),
              Text(
                fee == 0 ? 'Miễn phí' : _money(fee),
                style: TextStyle(fontWeight: FontWeight.w800, fontSize: 18, color: fee == 0 ? c.success : c.primary),
              ),
            ],
          ),
          if (fee > 0) ...[
            const SizedBox(height: 6),
            Row(
              children: [
                Icon(Icons.qr_code_2, size: 14, color: c.onSurfaceMuted),
                const SizedBox(width: 6),
                Text('Thanh toán qua QR PayOS', style: TextStyle(fontSize: 12, color: c.onSurfaceMuted)),
              ],
            ),
          ],
          const SizedBox(height: 16),
          ShadButton(
            width: double.infinity,
            size: ShadButtonSize.lg,
            onPressed: () => Navigator.pop(ctx, true),
            leading: const Icon(LucideIcons.badgeCheck, size: 18),
            child: Text(fee == 0 ? 'Đăng tin miễn phí' : 'Tiếp tục thanh toán'),
          ),
        ],
      ),
    );
  }

  Widget _feeRow(UniMoveColors c, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Text(label, style: TextStyle(color: c.onSurfaceMuted, fontSize: 13)),
          const Spacer(),
          Text(value, style: TextStyle(color: c.onSurface, fontWeight: FontWeight.w600, fontSize: 13)),
        ],
      ),
    );
  }

  String _money(int amount) {
    final s = amount.toString();
    final buf = StringBuffer();
    for (var i = 0; i < s.length; i++) {
      if (i > 0 && (s.length - i) % 3 == 0) buf.write('.');
      buf.write(s[i]);
    }
    return '$buf' 'đ';
  }

  Future<void> _submit() async {
    if (!_valid || _submitting || _imagePaths.isEmpty) return;
    setState(() => _submitting = true);
    try {
      final imageUrls = await Future.wait(
        _imagePaths.map((p) => _repo.uploadImage(filePath: p)),
      );
      final result = await _repo.create(
        title: _titleCtrl.text.trim(),
        description: _descCtrl.text.trim(),
        category: _category,
        condition: _condition,
        area: _fullArea,
        provinceId: _provinceId,
        price: _free ? 0 : (int.tryParse(_priceCtrl.text.trim()) ?? 0),
        usageDuration: _usageCtrl.text.trim(),
        isNegotiable: _negotiable,
        images: imageUrls,
      );
      if (!mounted) return;

      if (result.requiresPayment && result.listingFee > 0) {
        setState(() => _submitting = false);
        final paid = await ListingFeePaymentSheet.show(
          context,
          listingId: result.post.id,
          fee: result.listingFee,
        );
        if (!mounted) return;
        if (paid) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Đã thanh toán phí và đăng tin thành công')),
          );
          context.pop(true);
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Tin đã lưu nhưng chưa thanh toán phí — xem tại «Tin của tôi» để thanh toán'),
            ),
          );
          context.pop(true);
        }
        return;
      }

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Đã đăng tin pass đồ thành công')),
      );
      context.pop(true);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Không thể đăng tin: $e')),
      );
      setState(() => _submitting = false);
    }
  }

  Future<void> _showImageSourceSheet() async {
    final c = UniMoveColors.of(context);
    final source = await showModalBottomSheet<ImageSource>(
      context: context,
      backgroundColor: c.surface,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(12, 8, 12, 12),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                ListTile(
                  leading: Icon(Icons.photo_library_outlined, color: c.primary),
                  title: const Text('Thư viện ảnh'),
                  onTap: () => Navigator.pop(ctx, ImageSource.gallery),
                ),
                ListTile(
                  leading: Icon(Icons.photo_camera_outlined, color: c.primary),
                  title: const Text('Chụp ảnh'),
                  onTap: () => Navigator.pop(ctx, ImageSource.camera),
                ),
              ],
            ),
          ),
        );
      },
    );
    if (source == null) return;
    await _pickImage(source);
  }

  Future<void> _pickImage(ImageSource source) async {
    try {
      final picked = await _picker.pickImage(
        source: source,
        maxWidth: 1600,
        imageQuality: 85,
      );
      if (picked == null) return;
      if (_imagePaths.length < 5) {
        setState(() => _imagePaths.add(picked.path));
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Không mở được ảnh: $e')),
      );
    }
  }

  void _removeImage(int index) => setState(() => _imagePaths.removeAt(index));

  @override
  Widget build(BuildContext context) {
    final c = UniMoveColors.of(context);

    return ShadScreenScope(
      builder: (shadContext, theme) {
        return Scaffold(
          backgroundColor: c.background,
          appBar: AppBar(
            backgroundColor: c.background,
            surfaceTintColor: Colors.transparent,
            elevation: 0,
            scrolledUnderElevation: 0,
            iconTheme: IconThemeData(color: c.onSurface),
            title: Text('Đăng tin pass đồ', style: TextStyle(color: c.onSurface, fontWeight: FontWeight.w800)),
          ),
          body: ListView(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
            children: [
              _sectionLabel(c, 'Hình ảnh'),
              const SizedBox(height: 8),
              _imageUploadSection(c),
              const SizedBox(height: 20),
              _sectionLabel(c, 'Tên món đồ'),
              const SizedBox(height: 8),
              ShadInput(
                controller: _titleCtrl,
                placeholder: const Text('VD: Tủ quần áo gỗ 2 cánh'),
                leading: Icon(LucideIcons.tag, size: 18, color: c.primary),
                onChanged: (_) => setState(() {}),
              ),
              const SizedBox(height: 20),
              _sectionLabel(c, 'Danh mục'),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: PassItemCategories.all
                    .map((e) => _choiceChip(c, e, _category == e, () => setState(() => _category = e)))
                    .toList(),
              ),
              const SizedBox(height: 20),
              _sectionLabel(c, 'Tình trạng'),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: PassItemCondition.values
                    .map((e) =>
                        _choiceChip(c, e.label, _condition == e, () => setState(() => _condition = e)))
                    .toList(),
              ),
              const SizedBox(height: 20),
              _sectionLabel(c, 'Giá mong muốn'),
              const SizedBox(height: 8),
              ShadInput(
                controller: _priceCtrl,
                enabled: !_free,
                placeholder: Text(_free ? 'Miễn phí' : 'VD: 250000'),
                leading: Icon(LucideIcons.banknote, size: 18, color: c.primary),
                keyboardType: TextInputType.number,
                inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                onChanged: (_) => setState(() {}),
              ),
              const SizedBox(height: 10),
              _switchTile(c, 'Tặng miễn phí', 'Cho tặng, không lấy tiền', _free, (v) {
                setState(() {
                  _free = v;
                  if (v) _negotiable = false;
                });
              }),
              _switchTile(c, 'Có thể thương lượng', 'Cho phép trả giá', _negotiable, _free ? null : (v) {
                setState(() => _negotiable = v);
              }),
              const SizedBox(height: 20),
              _sectionLabel(c, 'Thời gian đã sử dụng'),
              const SizedBox(height: 8),
              ShadInput(
                controller: _usageCtrl,
                placeholder: const Text('VD: 6 tháng'),
                leading: Icon(LucideIcons.timer, size: 18, color: c.primary),
              ),
              const SizedBox(height: 20),
              const SizedBox(height: 16),
              _sectionLabel(c, 'Địa chỉ lấy đồ (quận, KTX, phường...)'),
              const SizedBox(height: 8),
              ShadInput(
                controller: _areaCtrl,
                placeholder: const Text('VD: KTX Khu B, Thủ Đức'),
                leading: Icon(LucideIcons.mapPin, size: 18, color: c.primary),
                onChanged: (_) => setState(() {}),
              ),
              const SizedBox(height: 20),
              _sectionLabel(c, 'Mô tả chi tiết'),
              const SizedBox(height: 8),
              ShadInput(
                controller: _descCtrl,
                placeholder: const Text('Mô tả tình trạng, lý do pass, lưu ý khi nhận...'),
                maxLines: 4,
              ),
              const SizedBox(height: 22),
              _sectionLabel(c, 'Xem trước tin đăng'),
              const SizedBox(height: 8),
              _preview(c),
              const SizedBox(height: 16),
              _feeCard(c),
              const SizedBox(height: 20),
              ShadButton(
                size: ShadButtonSize.lg,
                width: double.infinity,
                enabled: _valid && !_submitting,
                onPressed: _valid && !_submitting ? _confirmAndSubmit : null,
                leading: _submitting
                    ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Icon(LucideIcons.send, size: 18),
                child: Text(_submitting ? 'Đang đăng...' : 'Tiếp tục đăng tin'),
              ),
              if (!_valid) ...[
                const SizedBox(height: 8),
                Text(
                  'Cần tải ảnh, nhập tên món đồ, địa chỉ lấy đồ và giá (hoặc chọn miễn phí).',
                  style: TextStyle(fontSize: 12, color: c.onSurfaceMuted),
                ),
              ],
            ],
          ),
        );
      },
    );
  }

  Widget _sectionLabel(UniMoveColors c, String text) {
    return Text(text, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: c.onSurface));
  }

  Widget _feeCard(UniMoveColors c) {
    final fee = _listingFee;
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: c.chipBg,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: c.border),
      ),
      child: Row(
        children: [
          Icon(LucideIcons.receipt, size: 20, color: c.primary),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Phí đăng tin', style: TextStyle(fontWeight: FontWeight.w700, color: c.onSurface)),
                Text(PassListingFee.rateLabel, style: TextStyle(fontSize: 11, color: c.onSurfaceMuted, height: 1.3)),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Text(
            fee == 0 ? 'Miễn phí' : _money(fee),
            style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16, color: fee == 0 ? c.success : c.primary),
          ),
        ],
      ),
    );
  }

  Widget _imageUploadSection(UniMoveColors c) {
    const maxImages = 5;

    // Empty state
    if (_imagePaths.isEmpty) {
      return Material(
        color: c.surface,
        borderRadius: BorderRadius.circular(16),
        child: InkWell(
          onTap: _showImageSourceSheet,
          borderRadius: BorderRadius.circular(16),
          child: Container(
            width: double.infinity,
            height: 160,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: c.border, width: 1.5),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.cloud_upload_outlined, size: 40, color: c.primary),
                const SizedBox(height: 10),
                Text('Tải ảnh từ máy',
                    style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15, color: c.onSurface)),
                const SizedBox(height: 4),
                Text('Chọn từ thư viện hoặc chụp ảnh (tối đa $maxImages ảnh)',
                    style: TextStyle(fontSize: 12, color: c.onSurfaceMuted)),
              ],
            ),
          ),
        ),
      );
    }

    // Has images — scrollable row of thumbs + add button
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: [
              for (int i = 0; i < _imagePaths.length; i++) ...[
                _imageThumb(c, _imagePaths[i], i),
                const SizedBox(width: 8),
              ],
              if (_imagePaths.length < maxImages) _addImageBtn(c),
            ],
          ),
        ),
        const SizedBox(height: 8),
        Text(
          '${_imagePaths.length}/$maxImages ảnh · Ảnh đầu tiên là ảnh bìa',
          style: TextStyle(fontSize: 11, color: c.onSurfaceMuted),
        ),
      ],
    );
  }

  Widget _imageThumb(UniMoveColors c, String path, int index) {
    return Stack(
      children: [
        PassItemImage(
          imageUrl: path,
          width: 100,
          height: 100,
          borderRadius: BorderRadius.circular(12),
          fit: BoxFit.cover,
          errorPlaceholder: Container(
            width: 100,
            height: 100,
            decoration: BoxDecoration(color: c.surfaceTint, borderRadius: BorderRadius.circular(12)),
            child: Icon(Icons.broken_image_outlined, color: c.onSurfaceMuted, size: 28),
          ),
        ),
        Positioned(
          top: 4, right: 4,
          child: GestureDetector(
            onTap: () => _removeImage(index),
            child: Container(
              width: 22, height: 22,
              decoration: const BoxDecoration(color: Colors.black54, shape: BoxShape.circle),
              child: const Icon(Icons.close, size: 13, color: Colors.white),
            ),
          ),
        ),
        if (index == 0)
          Positioned(
            bottom: 4, left: 4,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
              decoration: BoxDecoration(color: Colors.black54, borderRadius: BorderRadius.circular(4)),
              child: const Text('Bìa', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w600)),
            ),
          ),
      ],
    );
  }

  Widget _addImageBtn(UniMoveColors c) {
    return GestureDetector(
      onTap: _showImageSourceSheet,
      child: Container(
        width: 100,
        height: 100,
        decoration: BoxDecoration(
          color: c.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: c.border, width: 1.5),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.add_photo_alternate_outlined, size: 28, color: c.primary),
            const SizedBox(height: 4),
            Text('Thêm ảnh', style: TextStyle(fontSize: 11, color: c.primary, fontWeight: FontWeight.w600)),
          ],
        ),
      ),
    );
  }

  Widget _choiceChip(UniMoveColors c, String label, bool selected, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
        decoration: BoxDecoration(
          color: selected ? c.primary : c.surface,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: selected ? c.primary : c.border),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: selected ? Colors.white : c.onSurface,
            fontWeight: FontWeight.w600,
            fontSize: 13,
          ),
        ),
      ),
    );
  }

  Widget _switchTile(UniMoveColors c, String title, String subtitle, bool value, ValueChanged<bool>? onChanged) {
    final disabled = onChanged == null;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title,
                    style: TextStyle(
                        fontWeight: FontWeight.w600,
                        color: disabled ? c.onSurfaceMuted : c.onSurface)),
                Text(subtitle, style: TextStyle(fontSize: 12, color: c.onSurfaceMuted)),
              ],
            ),
          ),
          Switch.adaptive(value: value, activeThumbColor: c.primary, onChanged: onChanged),
        ],
      ),
    );
  }

  Widget _preview(UniMoveColors c) {
    final priceLabel = _free
        ? 'Miễn phí'
        : (() {
            final p = int.tryParse(_priceCtrl.text.trim()) ?? 0;
            if (p <= 0) return 'Chưa nhập giá';
            return passItemPriceLabel(
              PassItemPost(
                id: '_',
                title: '',
                description: '',
                category: _category,
                condition: _condition,
                area: '',
                price: p,
                imageUrl: '',
                usageDuration: '',
                posterName: '',
                posterContact: '',
                status: PassItemStatus.open,
                createdAt: DateTime.now(),
              ),
            );
          })();

    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: c.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: c.border),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (_previewImage != null)
            PassItemImage(
              imageUrl: _previewImage!,
              width: 80,
              height: 80,
              borderRadius: BorderRadius.circular(12),
              errorPlaceholder: Container(width: 80, height: 80, color: c.surfaceTint),
            )
          else
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(color: c.surfaceTint, borderRadius: BorderRadius.circular(12)),
              child: Icon(Icons.add_photo_alternate_outlined, color: c.onSurfaceMuted),
            ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _titleCtrl.text.trim().isEmpty ? 'Tên món đồ' : _titleCtrl.text.trim(),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(fontWeight: FontWeight.w700, color: c.onSurface, fontSize: 15),
                ),
                const SizedBox(height: 4),
                Text(priceLabel,
                    style: TextStyle(fontWeight: FontWeight.w800, color: _free ? c.success : c.primary)),
                const SizedBox(height: 6),
                Text('${_condition.label} · $_category',
                    style: TextStyle(fontSize: 12, color: c.onSurfaceMuted)),
                Text(_areaCtrl.text.trim().isEmpty ? 'Chưa nhập địa chỉ' : _fullArea,
                    maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 12, color: c.onSurfaceMuted)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
