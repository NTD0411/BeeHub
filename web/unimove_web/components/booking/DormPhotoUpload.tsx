"use client";

import { useRef } from "react";
import { ImagePlus, X } from "lucide-react";
import {
  DORM_PHOTO_LABELS,
  MAX_DORM_PHOTOS_PER_SECTION,
  type DormPhotoSection,
} from "@/lib/booking/constants";
import { useBookingFlowStore, type DormPhotoItem } from "@/lib/stores/useBookingFlowStore";

const EMPTY_PHOTOS: DormPhotoItem[] = [];

interface DormPhotoUploadProps {
  section: DormPhotoSection;
}

export function DormPhotoUpload({ section }: DormPhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const photos = useBookingFlowStore((s) => s.dormPhotos[section] ?? EMPTY_PHOTOS);
  const addDormPhoto = useBookingFlowStore((s) => s.addDormPhoto);
  const removeDormPhoto = useBookingFlowStore((s) => s.removeDormPhoto);

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      addDormPhoto(section, file);
    }
    e.target.value = "";
  };

  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-2.5">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium leading-tight text-gray-900">
          {DORM_PHOTO_LABELS[section]}
        </p>
        <p className="mt-0.5 text-[10px] text-gray-400">
          {photos.length}/{MAX_DORM_PHOTOS_PER_SECTION} ảnh
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        {photos.map((photo, index) => (
          <div
            key={photo.id}
            className="relative h-11 w-11 overflow-hidden rounded-lg border border-gray-200"
          >
            <img src={photo.previewUrl} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => removeDormPhoto(section, index)}
              className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-black/60 text-white"
              aria-label="Xóa ảnh"
            >
              <X size={10} />
            </button>
          </div>
        ))}
        {photos.length < MAX_DORM_PHOTOS_PER_SECTION && (
          <>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex h-11 w-11 flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 text-gray-500 transition hover:border-[#0047FF] hover:text-[#0047FF]"
              aria-label="Thêm ảnh"
            >
              <ImagePlus size={15} />
            </button>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onPick}
            />
          </>
        )}
      </div>
    </div>
  );
}
