import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';

import '../../../../core/theme/uni_move_colors.dart';
import '../../../../core/widgets/booking_scaffold.dart';
import '../../../../core/widgets/smooth_cta_button.dart';
import '../../../pass_items/presentation/widgets/pass_item_image.dart';
import '../../domain/booking_models.dart';
import '../cubit/booking_flow_cubit.dart';
import '../cubit/booking_flow_state.dart';

/// Mô tả trọ — đường vào, tầng, khối lượng đồ để nhà xe chuẩn bị đúng.
class MoveDormDetailsPage extends StatefulWidget {
  const MoveDormDetailsPage({super.key});

  @override
  State<MoveDormDetailsPage> createState() => _MoveDormDetailsPageState();
}

class _MoveDormDetailsPageState extends State<MoveDormDetailsPage> {
  late final TextEditingController _noteCtrl;
  final _picker = ImagePicker();
  @override
  void initState() {
    super.initState();
    _noteCtrl = TextEditingController(text: context.read<BookingFlowCubit>().state.dormNote);
  }

  @override
  void dispose() {
    _noteCtrl.dispose();
    super.dispose();
  }

  String _nextRoute(BookingFlowState state) => '/booking/schedule';

  @override
  Widget build(BuildContext context) {
    final c = UniMoveColors.of(context);

    return BlocBuilder<BookingFlowCubit, BookingFlowState>(
      builder: (context, state) {
        final cubit = context.read<BookingFlowCubit>();

        return BookingScaffold(
          title: 'Mô tả trọ',
          body: ListView(
            padding: EdgeInsets.fromLTRB(20.w, 8.h, 20.w, 120.h),
            children: [
              _infoBanner(c, state),
              SizedBox(height: 16.h),
              _routeSummary(c, state),
              SizedBox(height: 20.h),
              _sectionTitle(c, 'Trọ cũ (điểm lấy đồ)'),
              SizedBox(height: 10.h),
              _floorRow(
                c,
                state.pickupFloor,
                state.pickupHasElevator,
                cubit.setPickupFloor,
                cubit.setPickupHasElevator,
              ),
              SizedBox(height: 12.h),
              _alleyChips(c, state.pickupAlleyAccess, cubit.setPickupAlley),
              if (DormPhotoSection.pickupStairs.isVisible(
                pickupHasElevator: state.pickupHasElevator,
                pickupAlley: state.pickupAlleyAccess,
                destinationHasElevator: state.hasElevator,
                destinationAlley: state.destinationAlleyAccess,
                cargoVolume: state.cargoVolume,
              )) ...[
                SizedBox(height: 12.h),
                _sectionPhotoUpload(c, state, cubit, DormPhotoSection.pickupStairs),
              ],
              if (DormPhotoSection.pickupAlley.isVisible(
                pickupHasElevator: state.pickupHasElevator,
                pickupAlley: state.pickupAlleyAccess,
                destinationHasElevator: state.hasElevator,
                destinationAlley: state.destinationAlleyAccess,
                cargoVolume: state.cargoVolume,
              )) ...[
                SizedBox(height: 12.h),
                _sectionPhotoUpload(c, state, cubit, DormPhotoSection.pickupAlley),
              ],
              SizedBox(height: 20.h),
              _sectionTitle(c, 'Trọ mới (điểm giao)'),
              SizedBox(height: 10.h),
              _floorRow(c, state.floorCount, state.hasElevator, cubit.setFloorCount, cubit.setHasElevator),
              SizedBox(height: 12.h),
              _alleyChips(c, state.destinationAlleyAccess, cubit.setDestinationAlley),
              if (DormPhotoSection.destinationStairs.isVisible(
                pickupHasElevator: state.pickupHasElevator,
                pickupAlley: state.pickupAlleyAccess,
                destinationHasElevator: state.hasElevator,
                destinationAlley: state.destinationAlleyAccess,
                cargoVolume: state.cargoVolume,
              )) ...[
                SizedBox(height: 12.h),
                _sectionPhotoUpload(c, state, cubit, DormPhotoSection.destinationStairs),
              ],
              if (DormPhotoSection.destinationAlley.isVisible(
                pickupHasElevator: state.pickupHasElevator,
                pickupAlley: state.pickupAlleyAccess,
                destinationHasElevator: state.hasElevator,
                destinationAlley: state.destinationAlleyAccess,
                cargoVolume: state.cargoVolume,
              )) ...[
                SizedBox(height: 12.h),
                _sectionPhotoUpload(c, state, cubit, DormPhotoSection.destinationAlley),
              ],
              SizedBox(height: 20.h),
              _sectionTitle(c, 'Khối lượng đồ'),
              SizedBox(height: 10.h),
              _cargoChips(c, state.cargoVolume, cubit.setCargoVolume),
              if (DormPhotoSection.cargo.isVisible(
                pickupHasElevator: state.pickupHasElevator,
                pickupAlley: state.pickupAlleyAccess,
                destinationHasElevator: state.hasElevator,
                destinationAlley: state.destinationAlleyAccess,
                cargoVolume: state.cargoVolume,
              )) ...[
                SizedBox(height: 12.h),
                _sectionPhotoUpload(c, state, cubit, DormPhotoSection.cargo),
              ],
              if (!state.isComboBooking) ...[
                SizedBox(height: 20.h),
                _transportLaborSection(c, state, cubit),
              ],
              SizedBox(height: 20.h),
              _sectionTitle(c, 'Ghi chú thêm'),
              SizedBox(height: 8.h),
              TextField(
                controller: _noteCtrl,
                onChanged: cubit.setDormNote,
                maxLines: 3,
                decoration: InputDecoration(
                  hintText: 'VD: Có tủ lớn, máy giặt; cổng hẻm hẹp sau 17h...',
                  filled: true,
                  fillColor: c.surfaceTint,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14.r),
                    borderSide: BorderSide.none,
                  ),
                ),
              ),
              if (state.dormImageCount == 0) ...[
                SizedBox(height: 12.h),
                Text(
                  'Chọn hẻm hẹp, không thang máy hoặc nhiều đồ để hiện ô upload ảnh tương ứng.',
                  style: TextStyle(fontSize: 12.sp, color: c.onSurfaceMuted, height: 1.35),
                ),
              ],
            ],
          ),
          bottom: SafeArea(
            child: Padding(
              padding: EdgeInsets.fromLTRB(20.w, 8.h, 20.w, 16.h),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    state.isComboBooking
                        ? 'Thông tin này gửi kèm đơn combo cho nhà xe — tránh phụ thu bất ngờ'
                        : state.wantsTransportLabor
                            ? 'Bước tiếp: chọn giờ — nhà xe báo giá xe + khuân vác gộp'
                            : 'Bước tiếp: chọn giờ mong muốn — nhà xe báo giá theo khung đó',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 12.sp, color: c.onSurfaceMuted, height: 1.3),
                  ),
                  SizedBox(height: 10.h),
                  SmoothCtaButton(
                    label: 'Chọn ngày giờ',
                    onPressed: () => context.push(_nextRoute(state)),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _infoBanner(UniMoveColors c, BookingFlowState state) {
    return Container(
      padding: EdgeInsets.all(14.w),
      decoration: BoxDecoration(
        color: c.chipBg,
        borderRadius: BorderRadius.circular(14.r),
        border: Border.all(color: c.primary.withValues(alpha: 0.25)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.info_outline, size: 20.sp, color: c.primary),
          SizedBox(width: 10.w),
          Expanded(
            child: Text(
              state.isComboBooking
                  ? 'Combo niêm yết giá xe+km cố định, nhưng nhà xe vẫn cần biết đường vào trọ '
                      'và khối lượng đồ để chuẩn bị xe & đội khuân vác.'
                  : 'Mô tả càng rõ, nhà xe báo giá càng chính xác. '
                      'Bật khuân vác nếu cần — nhà xe sẽ báo giá xe + người khuân gộp một lần.',
              style: TextStyle(fontSize: 12.sp, color: c.onSurface, height: 1.35),
            ),
          ),
        ],
      ),
    );
  }

  Widget _routeSummary(UniMoveColors c, BookingFlowState state) {
    return Container(
      padding: EdgeInsets.all(14.w),
      decoration: BoxDecoration(
        color: c.surface,
        borderRadius: BorderRadius.circular(16.r),
        border: Border.all(color: c.border),
      ),
      child: Column(
        children: [
          _routeLine(Icons.trip_origin, c.primary, state.pickup),
          Padding(
            padding: EdgeInsets.only(left: 11.w),
            child: Align(
              alignment: Alignment.centerLeft,
              child: Container(width: 2, height: 20.h, color: c.border),
            ),
          ),
          _routeLine(Icons.location_on, c.accentGreen, state.destination),
        ],
      ),
    );
  }

  Widget _routeLine(IconData icon, Color color, String text) {
    return Row(
      children: [
        Icon(icon, size: 18.sp, color: color),
        SizedBox(width: 10.w),
        Expanded(
          child: Text(
            text,
            style: TextStyle(fontSize: 14.sp, fontWeight: FontWeight.w600),
          ),
        ),
      ],
    );
  }

  Widget _sectionTitle(UniMoveColors c, String text) {
    return Text(
      text,
      style: TextStyle(fontSize: 16.sp, fontWeight: FontWeight.w700, color: c.onSurface),
    );
  }

  Widget _floorRow(
    UniMoveColors c,
    int floor,
    bool hasElevator,
    void Function(int) onFloor,
    void Function(bool) onElevator,
  ) {
    return Column(
      children: [
        Row(
          children: [
            Text('Tầng', style: TextStyle(fontSize: 14.sp, color: c.onSurfaceMuted)),
            const Spacer(),
            _roundBtn(c, Icons.remove, () => onFloor(floor - 1)),
            SizedBox(width: 12.w),
            Text('$floor', style: TextStyle(fontSize: 18.sp, fontWeight: FontWeight.w700)),
            SizedBox(width: 12.w),
            _roundBtn(c, Icons.add, () => onFloor(floor + 1)),
          ],
        ),
        SizedBox(height: 10.h),
        SwitchListTile(
          contentPadding: EdgeInsets.zero,
          title: Text('Có thang máy', style: TextStyle(fontSize: 14.sp)),
          value: hasElevator,
          activeThumbColor: c.primary,
          onChanged: onElevator,
        ),
      ],
    );
  }

  Widget _roundBtn(UniMoveColors c, IconData icon, VoidCallback onTap) {
    return Material(
      color: c.surfaceTint,
      shape: const CircleBorder(),
      child: InkWell(
        onTap: onTap,
        customBorder: const CircleBorder(),
        child: SizedBox(
          width: 36.w,
          height: 36.w,
          child: Icon(icon, size: 18.sp, color: c.primary),
        ),
      ),
    );
  }

  Widget _alleyChips(UniMoveColors c, AlleyAccess selected, void Function(AlleyAccess) onSelect) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Đường vào', style: TextStyle(fontSize: 14.sp, color: c.onSurfaceMuted)),
        SizedBox(height: 8.h),
        Wrap(
          spacing: 8.w,
          runSpacing: 8.h,
          children: AlleyAccess.values.map((a) {
            final isSelected = selected == a;
            return ChoiceChip(
              label: Text(a.label, style: TextStyle(fontSize: 12.sp)),
              selected: isSelected,
              onSelected: (_) => onSelect(a),
              selectedColor: c.primary,
              labelStyle: TextStyle(
                color: isSelected ? Colors.white : c.onSurface,
                fontWeight: FontWeight.w600,
              ),
            );
          }).toList(),
        ),
        if (selected != AlleyAccess.unknown) ...[
          SizedBox(height: 6.h),
          Text(selected.hint, style: TextStyle(fontSize: 11.sp, color: c.onSurfaceMuted)),
        ],
      ],
    );
  }

  Widget _transportLaborSection(UniMoveColors c, BookingFlowState state, BookingFlowCubit cubit) {
    return Container(
      padding: EdgeInsets.all(14.w),
      decoration: BoxDecoration(
        color: c.surface,
        borderRadius: BorderRadius.circular(16.r),
        border: Border.all(
          color: state.wantsTransportLabor ? c.primary.withValues(alpha: 0.4) : c.border,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SwitchListTile(
            contentPadding: EdgeInsets.zero,
            title: Text(
              'Muốn thuê người khuân vác',
              style: TextStyle(fontSize: 15.sp, fontWeight: FontWeight.w700, color: c.onSurface),
            ),
            subtitle: Text(
              'Nhà xe báo giá vận chuyển + khuân vác trong cùng một báo giá',
              style: TextStyle(fontSize: 12.sp, color: c.onSurfaceMuted, height: 1.3),
            ),
            value: state.wantsTransportLabor,
            activeThumbColor: c.primary,
            onChanged: cubit.setWantsTransportLabor,
          ),
          if (state.wantsTransportLabor) ...[
            Divider(height: 20.h, color: c.border),
            Text('Số người', style: TextStyle(fontSize: 14.sp, color: c.onSurfaceMuted)),
            SizedBox(height: 8.h),
            _counterRow(
              c,
              state.transportLaborHelpers,
              'người',
              () => cubit.setTransportLaborHelpers(state.transportLaborHelpers - 1),
              () => cubit.setTransportLaborHelpers(state.transportLaborHelpers + 1),
            ),
            SizedBox(height: 14.h),
            Text('Thời gian làm việc', style: TextStyle(fontSize: 14.sp, color: c.onSurfaceMuted)),
            SizedBox(height: 8.h),
            Wrap(
              spacing: 8.w,
              children: LaborPricing.hourOptions.map((h) {
                final selected = state.transportLaborHours == h;
                return ChoiceChip(
                  label: Text('$h giờ', style: TextStyle(fontSize: 12.sp)),
                  selected: selected,
                  onSelected: (_) => cubit.setTransportLaborHours(h),
                  selectedColor: c.primary,
                  labelStyle: TextStyle(
                    color: selected ? Colors.white : c.onSurface,
                    fontWeight: FontWeight.w600,
                  ),
                );
              }).toList(),
            ),
          ],
        ],
      ),
    );
  }

  Widget _counterRow(
    UniMoveColors c,
    int value,
    String label,
    VoidCallback onMinus,
    VoidCallback onPlus,
  ) {
    return Row(
      children: [
        _roundBtn(c, Icons.remove, onMinus),
        SizedBox(width: 16.w),
        Text('$value $label', style: TextStyle(fontSize: 16.sp, fontWeight: FontWeight.w700)),
        const Spacer(),
        _roundBtn(c, Icons.add, onPlus),
      ],
    );
  }

  Widget _cargoChips(UniMoveColors c, CargoVolume selected, void Function(CargoVolume) onSelect) {
    return Column(
      children: CargoVolume.values.map((v) {
        final isSelected = selected == v;
        return Padding(
          padding: EdgeInsets.only(bottom: 8.h),
          child: Material(
            color: isSelected ? c.primaryContainer : c.surface,
            borderRadius: BorderRadius.circular(14.r),
            child: InkWell(
              borderRadius: BorderRadius.circular(14.r),
              onTap: () => onSelect(v),
              child: Container(
                width: double.infinity,
                padding: EdgeInsets.symmetric(horizontal: 14.w, vertical: 12.h),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(14.r),
                  border: Border.all(color: isSelected ? c.primary : c.border),
                ),
                child: Row(
                  children: [
                    Icon(
                      isSelected ? Icons.radio_button_checked : Icons.radio_button_off,
                      color: isSelected ? c.primary : c.onSurfaceMuted,
                      size: 20.sp,
                    ),
                    SizedBox(width: 10.w),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(v.label, style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14.sp)),
                          Text(v.examples, style: TextStyle(fontSize: 12.sp, color: c.onSurfaceMuted)),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _sectionPhotoUpload(
    UniMoveColors c,
    BookingFlowState state,
    BookingFlowCubit cubit,
    DormPhotoSection section,
  ) {
    final paths = state.dormPhotos[section] ?? [];
    final max = BookingFlowCubit.maxPhotosPerSection;

    return Container(
      width: double.infinity,
      padding: EdgeInsets.all(12.w),
      decoration: BoxDecoration(
        color: c.surfaceTint,
        borderRadius: BorderRadius.circular(12.r),
        border: Border.all(color: c.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.add_photo_alternate_outlined, size: 16.sp, color: c.primary),
              SizedBox(width: 6.w),
              Expanded(
                child: Text(
                  section.label,
                  style: TextStyle(fontSize: 12.sp, fontWeight: FontWeight.w700, color: c.onSurface),
                ),
              ),
              Text(
                '${paths.length}/$max',
                style: TextStyle(fontSize: 11.sp, color: c.onSurfaceMuted),
              ),
            ],
          ),
          SizedBox(height: 10.h),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                for (var i = 0; i < paths.length; i++) ...[
                  _imageThumb(c, paths[i], section, i, cubit),
                  SizedBox(width: 8.w),
                ],
                if (paths.length < max) _addImageBtn(c, section, cubit),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _imageThumb(
    UniMoveColors c,
    String path,
    DormPhotoSection section,
    int index,
    BookingFlowCubit cubit,
  ) {
    return Stack(
      children: [
        PassItemImage(
          imageUrl: path,
          width: 88.w,
          height: 88.w,
          borderRadius: BorderRadius.circular(12.r),
          fit: BoxFit.cover,
        ),
        Positioned(
          top: 4,
          right: 4,
          child: GestureDetector(
            onTap: () => cubit.removeDormPhoto(section, index),
            child: Container(
              width: 22,
              height: 22,
              decoration: const BoxDecoration(color: Colors.black54, shape: BoxShape.circle),
              child: const Icon(Icons.close, size: 13, color: Colors.white),
            ),
          ),
        ),
      ],
    );
  }

  Widget _addImageBtn(UniMoveColors c, DormPhotoSection section, BookingFlowCubit cubit) {
    return GestureDetector(
      onTap: () => _showImageSourceSheet(cubit, section),
      child: Container(
        width: 88.w,
        height: 88.w,
        decoration: BoxDecoration(
          color: c.surface,
          borderRadius: BorderRadius.circular(12.r),
          border: Border.all(color: c.border, width: 1.5),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.add, size: 24.sp, color: c.primary),
            SizedBox(height: 2.h),
            Text('Thêm', style: TextStyle(fontSize: 10.sp, color: c.primary, fontWeight: FontWeight.w600)),
          ],
        ),
      ),
    );
  }

  Future<void> _showImageSourceSheet(BookingFlowCubit cubit, DormPhotoSection section) async {
    final c = UniMoveColors.of(context);
    final source = await showModalBottomSheet<ImageSource>(
      context: context,
      backgroundColor: c.surface,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20.r))),
      builder: (ctx) {
        return SafeArea(
          child: Padding(
            padding: EdgeInsets.fromLTRB(12.w, 8.h, 12.w, 12.h),
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
    await _pickImage(source, cubit, section);
  }

  Future<void> _pickImage(ImageSource source, BookingFlowCubit cubit, DormPhotoSection section) async {
    try {
      final picked = await _picker.pickImage(source: source, maxWidth: 1600, imageQuality: 85);
      if (picked == null) return;
      cubit.addDormPhoto(section, picked.path);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Không mở được ảnh: $e')),
      );
    }
  }
}
