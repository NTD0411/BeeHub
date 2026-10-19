import { redirect } from "next/navigation";

/** Thông báo hiển thị qua pop-up chuông trên header — không còn trang riêng */
export default function ThongBaoRedirect() {
  redirect("/trang-chu");
}
