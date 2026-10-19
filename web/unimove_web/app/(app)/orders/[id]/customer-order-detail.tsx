"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, MapPin, Phone, Star, CheckCircle, Truck, Clock, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ordersApi } from "@/lib/api";
import { getOrderStatusLabel, getOrderStatusColor, formatVND, formatDate } from "@/lib/utils";

interface OrderDetail { id:string;status:string;service_type:string;pickup_address:string;dropoff_address:string;description?:string;floor_number?:number;num_helpers?:number;special_notes?:string;estimated_price?:number;final_price?:number;deposit_amount?:number;created_at:string;provider?:{id:string;full_name:string;phone:string;rating:number;vehicle_type?:string}; }
const STEPS=[{key:"pending",label:"Chờ xác nhận",icon:Clock},{key:"accepted",label:"Đã chấp nhận",icon:CheckCircle},{key:"picking_up",label:"Đang đến đón",icon:Truck},{key:"in_progress",label:"Đang vận chuyển",icon:Truck},{key:"completed",label:"Hoàn thành",icon:CheckCircle}];

export default function CustomerOrderDetailPage() {
  const {id}=useParams<{id:string}>();
  const [order,setOrder]=useState<OrderDetail|null>(null);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{ordersApi.get(id).then(r=>{if(r.success&&r.data)setOrder(r.data as OrderDetail);}).finally(()=>setLoading(false));},[id]);
  const sc=order?getOrderStatusColor(order.status):"var(--muted)";
  const stepIdx=order?STEPS.findIndex(s=>s.key===order.status):-1;
  return (
    <div className="min-h-screen" style={{ backgroundColor:"var(--bg)" }}>
      <div className="px-4 pt-12 pb-4" style={{ backgroundColor:"var(--card)", borderBottom:"1px solid var(--border)" }}>
        <div className="flex items-center gap-3">
          <Link href="/orders" className="p-2 rounded-xl" style={{ backgroundColor:"var(--surface)" }}><ArrowLeft size={20} style={{ color:"var(--text)" }}/></Link>
          <div><h1 className="text-lg font-bold" style={{ color:"var(--text)" }}>Chi tiết đơn hàng</h1>
            {order&&<p className="text-xs" style={{ color:"var(--muted)" }}>#{order.id.slice(0,8).toUpperCase()}</p>}</div>
        </div>
      </div>
      {loading?<div className="px-4 py-4 space-y-4">{[1,2,3].map(i=><Skeleton key={i} className="h-32 rounded-2xl"/>)}</div>
      :!order?<div className="text-center py-16"><p style={{ color:"var(--muted)" }}>Không tìm thấy</p><Link href="/orders"><Button variant="outline" className="mt-4">Quay lại</Button></Link></div>
      :<div className="px-4 py-4 space-y-4">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <Badge style={{ backgroundColor:sc+"22",color:sc,border:`1px solid ${sc}44`,fontSize:"13px",padding:"4px 12px" }}>{getOrderStatusLabel(order.status)}</Badge>
            <span className="text-xs" style={{ color:"var(--muted)" }}>{formatDate(order.created_at)}</span>
          </div>
          {order.status!=="cancelled"&&(
            <div className="flex items-center justify-between relative">
              <div className="absolute top-4 left-0 right-0 h-0.5" style={{ backgroundColor:"var(--border)" }}/>
              {STEPS.slice(0,5).map((step,i)=>{const done=i<=stepIdx;const Icon=step.icon;return(
                <div key={step.key} className="flex flex-col items-center z-10">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center border-2" style={{ backgroundColor:done?"var(--primary)":"var(--surface)",borderColor:done?"var(--primary)":"var(--border)" }}>
                    <Icon size={14} style={{ color:done?"white":"var(--muted)" }}/>
                  </div>
                  <span className="text-[9px] text-center mt-1 leading-tight w-14" style={{ color:done?"var(--primary)":"var(--muted)" }}>{step.label}</span>
                </div>
              );})}
            </div>
          )}
        </Card>
        <Card className="p-5"><h3 className="font-bold mb-4" style={{ color:"var(--text)" }}>Lộ trình</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3"><div className="w-8 h-8 rounded-xl flex items-center justify-center mt-0.5 shrink-0" style={{ backgroundColor:"var(--primary-tint)" }}><div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor:"var(--primary)" }}/></div><div><p className="text-xs font-semibold mb-0.5" style={{ color:"var(--muted)" }}>ĐIỂM ĐÓN</p><p className="text-sm font-medium" style={{ color:"var(--text)" }}>{order.pickup_address}</p></div></div>
            <div className="ml-4 w-0.5 h-5" style={{ backgroundColor:"var(--border)" }}/>
            <div className="flex items-start gap-3"><div className="w-8 h-8 rounded-xl flex items-center justify-center mt-0.5 shrink-0" style={{ backgroundColor:"var(--success-tint)" }}><MapPin size={16} style={{ color:"var(--success)" }}/></div><div><p className="text-xs font-semibold mb-0.5" style={{ color:"var(--muted)" }}>ĐIỂM ĐẾN</p><p className="text-sm font-medium" style={{ color:"var(--text)" }}>{order.dropoff_address}</p></div></div>
          </div>
        </Card>
        {(order.estimated_price||order.final_price)&&(
          <Card className="p-5"><h3 className="font-bold mb-3" style={{ color:"var(--text)" }}>Thanh toán</h3>
            <div className="space-y-2">
              {order.estimated_price&&<div className="flex justify-between"><span className="text-sm" style={{ color:"var(--muted)" }}>Giá ước tính</span><span className="text-sm font-medium" style={{ color:"var(--text)" }}>{formatVND(order.estimated_price)}</span></div>}
              {order.deposit_amount&&<div className="flex justify-between"><span className="text-sm" style={{ color:"var(--muted)" }}>Đặt cọc</span><span className="text-sm font-medium text-green-500">{formatVND(order.deposit_amount)}</span></div>}
              {order.final_price&&<div className="flex justify-between pt-2" style={{ borderTop:"1px solid var(--border)" }}><span className="font-bold text-sm" style={{ color:"var(--text)" }}>Tổng cộng</span><span className="text-base font-bold" style={{ color:"var(--primary)" }}>{formatVND(order.final_price)}</span></div>}
            </div>
          </Card>
        )}
        {order.provider&&(
          <Card className="p-5"><h3 className="font-bold mb-3" style={{ color:"var(--text)" }}>Nhà vận chuyển</h3>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg" style={{ background:"linear-gradient(135deg,#1d4ed8,#3b82f6)" }}>{order.provider.full_name[0]}</div>
              <div className="flex-1"><p className="font-bold" style={{ color:"var(--text)" }}>{order.provider.full_name}</p>{order.provider.rating>0&&<div className="flex items-center gap-1 mt-0.5">{[1,2,3,4,5].map(s=><Star key={s} size={12} fill={s<=Math.round(order.provider!.rating)?"#f59e0b":"transparent"} style={{ color:"#f59e0b" }}/>)}<span className="text-xs ml-0.5" style={{ color:"var(--muted)" }}>{order.provider.rating.toFixed(1)}</span></div>}</div>
            </div>
            <a href={`tel:${order.provider.phone}`}><Button variant="outline" className="w-full gap-2"><Phone size={16}/> Gọi nhà xe</Button></a>
          </Card>
        )}
        {order.status==="completed"&&<Link href={`/orders/${order.id}/review`}><Card className="p-4 flex items-center justify-between" style={{ backgroundColor:"var(--primary-tint)",borderColor:"var(--primary)"+"44" }}><div className="flex items-center gap-3"><Star size={20} fill="var(--primary)" style={{ color:"var(--primary)" }}/><span className="font-semibold text-sm" style={{ color:"var(--primary)" }}>Đánh giá chuyến đi</span></div><ChevronRight size={18} style={{ color:"var(--primary)" }}/></Card></Link>}
      </div>}
    </div>
  );
}
