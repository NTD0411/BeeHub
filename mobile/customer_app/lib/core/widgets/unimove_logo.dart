import 'package:flutter/material.dart';

import '../theme/app_colors.dart';

class BeeHubLogo extends StatelessWidget {
  const BeeHubLogo({
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

class BeeHubLogoAccent extends StatelessWidget {
  const BeeHubLogoAccent({super.key, this.fontSize = 32});

  final double fontSize;

  @override
  Widget build(BuildContext context) {
    return BeeHubLogo(fontSize: fontSize, moveColor: AppColors.accent);
  }
}
