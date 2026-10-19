import 'pass_item.dart';

/// Tỉnh / thành phố — người dùng chọn nơi đang ở để xem tin trên chợ Pass đồ.
class PassItemProvince {
  const PassItemProvince({required this.id, required this.label});

  final String id;
  final String label;

  static const defaultId = 'hcm';

  static const all = <PassItemProvince>[
    PassItemProvince(id: 'hcm', label: 'TP. Hồ Chí Minh'),
    PassItemProvince(id: 'hn', label: 'Hà Nội'),
    PassItemProvince(id: 'dn', label: 'Đà Nẵng'),
    PassItemProvince(id: 'ct', label: 'Cần Thơ'),
    PassItemProvince(id: 'hp', label: 'Hải Phòng'),
    PassItemProvince(id: 'bd', label: 'Bình Dương'),
    PassItemProvince(id: 'dnai', label: 'Đồng Nai'),
    PassItemProvince(id: 'kh', label: 'Khánh Hòa'),
    PassItemProvince(id: 'hue', label: 'Thừa Thiên Huế'),
    PassItemProvince(id: 'ld', label: 'Lâm Đồng'),
    PassItemProvince(id: 'brvt', label: 'Bà Rịa - Vũng Tàu'),
    PassItemProvince(id: 'la', label: 'Long An'),
    PassItemProvince(id: 'bdinh', label: 'Bình Định'),
    PassItemProvince(id: 'qn', label: 'Quảng Nam'),
    PassItemProvince(id: 'dl', label: 'Đắk Lắk'),
    PassItemProvince(id: 'gl', label: 'Gia Lai'),
    PassItemProvince(id: 'na', label: 'Nghệ An'),
    PassItemProvince(id: 'th', label: 'Thanh Hóa'),
    PassItemProvince(id: 'qni', label: 'Quảng Ninh'),
    PassItemProvince(id: 'ag', label: 'An Giang'),
  ];

  static PassItemProvince resolve(String? id) {
    if (id == null || id.isEmpty) return all.first;
    return all.firstWhere((p) => p.id == id, orElse: () => all.first);
  }

  /// Suy tỉnh/thành từ chuỗi địa chỉ (mock / tin cũ chưa có [provinceId]).
  static String detectId(String area) {
    final a = area.toLowerCase();
    if (a.contains('hà nội') || a.contains('ha noi') || a.contains('hanoi')) return 'hn';
    if (a.contains('đà nẵng') || a.contains('da nang')) return 'dn';
    if (a.contains('cần thơ') || a.contains('can tho')) return 'ct';
    if (a.contains('hải phòng') || a.contains('hai phong')) return 'hp';
    if (a.contains('dĩ an') ||
        a.contains('di an') ||
        a.contains('bình dương') ||
        a.contains('binh duong') ||
        a.contains('thủ dầu') ||
        a.contains('thu dau')) {
      return 'bd';
    }
    if (a.contains('đồng nai') ||
        a.contains('dong nai') ||
        a.contains('biên hòa') ||
        a.contains('bien hoa')) {
      return 'dnai';
    }
    if (a.contains('nha trang') || a.contains('khánh hòa') || a.contains('khanh hoa')) return 'kh';
    if (a.contains('huế') || a.contains('hue') || a.contains('thừa thiên') || a.contains('thua thien')) {
      return 'hue';
    }
    if (a.contains('đà lạt') || a.contains('da lat') || a.contains('lâm đồng') || a.contains('lam dong')) {
      return 'ld';
    }
    if (a.contains('vũng tàu') || a.contains('vung tau') || a.contains('bà rịa') || a.contains('ba ria')) {
      return 'brvt';
    }
    if (a.contains('long an')) return 'la';
    if (a.contains('quy nhơn') || a.contains('quy nhon') || a.contains('bình định') || a.contains('binh dinh')) {
      return 'bdinh';
    }
    if (a.contains('quảng nam') || a.contains('quang nam') || a.contains('hội an') || a.contains('hoi an')) {
      return 'qn';
    }
    if (a.contains('buôn ma thuột') ||
        a.contains('buon ma thuot') ||
        a.contains('đắk lắk') ||
        a.contains('dak lak')) {
      return 'dl';
    }
    if (a.contains('gia lai') || a.contains('pleiku')) return 'gl';
    if (a.contains('nghệ an') || a.contains('nghe an') || a.contains('vinh,')) return 'na';
    if (a.contains('thanh hóa') || a.contains('thanh hoa')) return 'th';
    if (a.contains('quảng ninh') || a.contains('quang ninh') || a.contains('hạ long') || a.contains('ha long')) {
      return 'qni';
    }
    if (a.contains('an giang') || a.contains('long xuyên') || a.contains('long xuyen')) return 'ag';
    if (a.contains('tp.hcm') ||
        a.contains('tp. hcm') ||
        a.contains('hồ chí minh') ||
        a.contains('ho chi minh') ||
        a.contains('sài gòn') ||
        a.contains('sai gon') ||
        a.contains('thủ đức') ||
        a.contains('thu duc') ||
        RegExp(r'quận\s*\d').hasMatch(a) ||
        RegExp(r'quan\s*\d').hasMatch(a)) {
      return 'hcm';
    }
    return defaultId;
  }

  static String provinceIdOf(PassItemPost post) =>
      post.provinceId.isNotEmpty ? post.provinceId : detectId(post.area);

  static String formatArea({required String detail, required String provinceId}) {
    final d = detail.trim();
    final p = resolve(provinceId).label;
    if (d.isEmpty) return p;
    return '$d, $p';
  }

  bool matchesPost(PassItemPost post) => provinceIdOf(post) == id;
}
