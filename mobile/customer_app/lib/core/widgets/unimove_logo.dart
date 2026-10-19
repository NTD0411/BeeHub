import 'package:flutter/material.dart';

import '../theme/app_colors.dart';

class UniMoveLogo extends StatelessWidget {
  const UniMoveLogo({
    super.key,
    this.fontSize = 22,
    this.moveColor = AppColors.primary,
  });

  final double fontSize;
  final Color moveColor;

  @override
  Widget build(BuildContext context) {
    return RichText(
      text: TextSpan(
        style: TextStyle(
          fontSize: fontSize,
          fontWeight: FontWeight.w800,
          letterSpacing: -0.5,
        ),
        children: [
          const TextSpan(text: 'Uni', style: TextStyle(color: AppColors.onSurface)),
          TextSpan(text: 'Move', style: TextStyle(color: moveColor)),
        ],
      ),
    );
  }
}

class UniMoveLogoAccent extends StatelessWidget {
  const UniMoveLogoAccent({super.key, this.fontSize = 32});

  final double fontSize;

  @override
  Widget build(BuildContext context) {
    return UniMoveLogo(fontSize: fontSize, moveColor: AppColors.accent);
  }
}
