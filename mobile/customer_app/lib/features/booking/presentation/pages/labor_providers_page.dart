import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/widgets/booking_scaffold.dart';
import '../../../../core/widgets/smooth_cta_button.dart';
import '../cubit/booking_flow_cubit.dart';
import '../cubit/booking_flow_state.dart';
import '../widgets/labor_quotes_section.dart';

/// Màn so sánh báo giá toàn màn (cùng dữ liệu với bước cấu hình).
class LaborProvidersPage extends StatefulWidget {
  const LaborProvidersPage({super.key});

  @override
  State<LaborProvidersPage> createState() => _LaborProvidersPageState();
}

class _LaborProvidersPageState extends State<LaborProvidersPage> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<BookingFlowCubit>().loadLaborQuotes();
    });
  }

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<BookingFlowCubit, BookingFlowState>(
      builder: (context, state) {
        final cubit = context.read<BookingFlowCubit>();
        final selected = state.selectedLaborProvider;

        return BookingScaffold(
          title: 'So sánh báo giá',
          body: ListView(
            padding: EdgeInsets.fromLTRB(20.w, 8.h, 20.w, 100.h),
            children: [
              LaborQuotesSection(
                state: state,
                onSelect: cubit.selectLaborProvider,
              ),
            ],
          ),
          bottom: state.loadingLaborQuotes || selected == null
              ? null
              : SafeArea(
                  child: Padding(
                    padding: EdgeInsets.fromLTRB(20.w, 8.h, 20.w, 16.h),
                    child: SmoothCtaButton(
                      label: 'Tiếp tục · ${LaborQuotesSection.formatPrice(selected.price)}',
                      showArrow: false,
                      onPressed: () => context.push('/booking/payment'),
                    ),
                  ),
                ),
        );
      },
    );
  }
}
