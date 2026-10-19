/// Ngân hàng hỗ trợ giải ngân PayOS — mã BIN (napas) dùng khi xác minh tài khoản.
class VietnamBank {
  const VietnamBank({
    required this.name,
    required this.shortName,
    required this.binCode,
    required this.payosCode,
  });

  final String name;
  final String shortName;
  final String binCode;
  final String payosCode;
}

abstract final class VietnamBanks {
  static const all = <VietnamBank>[
    VietnamBank(name: 'Ngân hàng TMCP Ngoại thương Việt Nam', shortName: 'Vietcombank', binCode: '970436', payosCode: 'VCB'),
    VietnamBank(name: 'Ngân hàng TMCP Kỹ thương Việt Nam', shortName: 'Techcombank', binCode: '970407', payosCode: 'TCB'),
    VietnamBank(name: 'Ngân hàng TMCP Quân đội', shortName: 'MB Bank', binCode: '970422', payosCode: 'MB'),
    VietnamBank(name: 'Ngân hàng TMCP Việt Nam Thịnh Vượng', shortName: 'VPBank', binCode: '970432', payosCode: 'VPB'),
    VietnamBank(name: 'Ngân hàng TMCP Á Châu', shortName: 'ACB', binCode: '970416', payosCode: 'ACB'),
    VietnamBank(name: 'Ngân hàng TMCP Đầu tư và Phát triển Việt Nam', shortName: 'BIDV', binCode: '970418', payosCode: 'BIDV'),
    VietnamBank(name: 'Ngân hàng TMCP Sài Gòn Thương Tín', shortName: 'Sacombank', binCode: '970403', payosCode: 'STB'),
    VietnamBank(name: 'Ngân hàng TMCP Tiên Phong', shortName: 'TPBank', binCode: '970423', payosCode: 'TPB'),
    VietnamBank(name: 'Ngân hàng TMCP Phát triển TP.HCM', shortName: 'HDBank', binCode: '970437', payosCode: 'HDB'),
    VietnamBank(name: 'Ngân hàng TMCP Quốc tế Việt Nam', shortName: 'VIB', binCode: '970441', payosCode: 'VIB'),
    VietnamBank(name: 'Ngân hàng TMCP Hàng Hải', shortName: 'MSB', binCode: '970426', payosCode: 'MSB'),
    VietnamBank(name: 'Ngân hàng TMCP Nam Á', shortName: 'Nam A Bank', binCode: '970428', payosCode: 'NAB'),
  ];

  static VietnamBank? byShortName(String name) {
    for (final b in all) {
      if (b.shortName == name) return b;
    }
    return null;
  }
}
