import 'package:shared_preferences/shared_preferences.dart';

import '../domain/pass_item_provinces.dart';

const _key = 'pass_items_province_id';

Future<String> loadPassItemsProvinceId() async {
  final prefs = await SharedPreferences.getInstance();
  return prefs.getString(_key) ?? PassItemProvince.defaultId;
}

Future<void> savePassItemsProvinceId(String provinceId) async {
  final prefs = await SharedPreferences.getInstance();
  await prefs.setString(_key, provinceId);
}
