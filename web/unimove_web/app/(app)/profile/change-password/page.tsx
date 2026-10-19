"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getStoredUser } from "@/lib/auth";
import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { authApi } from "@/lib/api";
import { useToast } from "@/components/ui/toast";

function ChangePasswordContent() {
  const {toast}=useToast();
  const role=getStoredUser()?.role;
  const isProvider=role==="provider";
  const [form,setForm]=useState({current:"",new_pw:"",confirm:""});
  const [loading,setLoading]=useState(false);

  const handleSubmit=async(e:React.FormEvent)=>{
    e.preventDefault();
    if(form.new_pw!==form.confirm){toast("Mật khẩu không khớp","error");return;}
    if(form.new_pw.length<8){toast("Mật khẩu tối thiểu 8 ký tự","error");return;}
    setLoading(true);
    try{
      const r=await authApi.changePassword(form.current,form.new_pw);
      if(!r.success){toast((r as {message?:string}).message||"Thất bại","error");return;}
      toast("Đổi mật khẩu thành công!","success");
      setForm({current:"",new_pw:"",confirm:""});
    }catch(err){toast(err instanceof Error?err.message:"Lỗi kết nối","error");}
    finally{setLoading(false);}
  };

  const gradient=isProvider?"linear-gradient(135deg,#15803d,#22c55e)":"linear-gradient(135deg,#1d4ed8,#3b82f6)";
  return (
    <div className="min-h-screen" style={{ backgroundColor:"var(--bg)" }}>
      <div className="px-4 pt-12 pb-4" style={{ backgroundColor:"var(--card)", borderBottom:"1px solid var(--border)" }}>
        <div className="flex items-center gap-3">
          <Link href="/profile" className="p-2 rounded-xl" style={{ backgroundColor:"var(--surface)" }}><ArrowLeft size={20} style={{ color:"var(--text)" }}/></Link>
          <h1 className="text-lg font-bold" style={{ color:"var(--text)" }}>Đổi mật khẩu</h1>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="px-4 py-5 space-y-4">
        <div className="space-y-1.5"><label className="text-sm font-medium" style={{ color:"var(--text)" }}>Mật khẩu hiện tại</label><Input type="password" required value={form.current} onChange={e=>setForm(p=>({...p,current:e.target.value}))} startAdornment={<Lock size={15}/>}/></div>
        <div className="space-y-1.5"><label className="text-sm font-medium" style={{ color:"var(--text)" }}>Mật khẩu mới</label><Input type="password" required minLength={6} value={form.new_pw} onChange={e=>setForm(p=>({...p,new_pw:e.target.value}))} startAdornment={<Lock size={15}/>}/></div>
        <div className="space-y-1.5"><label className="text-sm font-medium" style={{ color:"var(--text)" }}>Xác nhận mật khẩu mới</label><Input type="password" required value={form.confirm} onChange={e=>setForm(p=>({...p,confirm:e.target.value}))} startAdornment={<Lock size={15}/>}/></div>
        <Button type="submit" size="xl" className="w-full" loading={loading} style={{ background:gradient, color:"white" }}>Đổi mật khẩu</Button>
      </form>
    </div>
  );
}

export default function ChangePasswordPage() {
  const router = useRouter();

  useEffect(() => {
    const r = getStoredUser()?.role ?? null;
    if (r === "customer") { router.replace("/tai-khoan/doi-mat-khau"); }
  }, [router]);

  const role = getStoredUser()?.role;
  if (role === "customer") return null;
  return <ChangePasswordContent />;
}
