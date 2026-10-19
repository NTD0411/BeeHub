import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

/// Ảnh tin Pass đồ — URL mạng hoặc đường dẫn file sau khi chọn/tải lên máy.
class PassItemImage extends StatelessWidget {
  const PassItemImage({
    super.key,
    required this.imageUrl,
    this.width,
    this.height,
    this.fit = BoxFit.cover,
    this.borderRadius,
    this.errorPlaceholder,
  });

  final String imageUrl;
  final double? width;
  final double? height;
  final BoxFit fit;
  final BorderRadius? borderRadius;
  final Widget? errorPlaceholder;

  static bool isNetworkUrl(String url) {
    final u = url.trim().toLowerCase();
    return u.startsWith('http://') || u.startsWith('https://');
  }

  @override
  Widget build(BuildContext context) {
    if (imageUrl.trim().isEmpty) {
      return _wrap(_placeholder());
    }

    Widget child;
    if (isNetworkUrl(imageUrl)) {
      child = Image.network(
        imageUrl,
        width: width,
        height: height,
        fit: fit,
        errorBuilder: (_, __, ___) => _placeholder(),
      );
    } else if (kIsWeb) {
      child = Image.network(
        imageUrl,
        width: width,
        height: height,
        fit: fit,
        errorBuilder: (_, __, ___) => _placeholder(),
      );
    } else {
      child = Image.file(
        File(imageUrl),
        width: width,
        height: height,
        fit: fit,
        errorBuilder: (_, __, ___) => _placeholder(),
      );
    }

    return _wrap(child);
  }

  Widget _wrap(Widget child) {
    if (borderRadius == null) return child;
    return ClipRRect(borderRadius: borderRadius!, child: child);
  }

  Widget _placeholder() {
    return errorPlaceholder ??
        Container(
          width: width,
          height: height,
          color: Colors.black12,
          alignment: Alignment.center,
          child: const Icon(Icons.image_not_supported_outlined, color: Colors.black38),
        );
  }
}
