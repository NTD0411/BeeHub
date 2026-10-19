"use client";

import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import { mapsApi } from "@/lib/api";

export interface AddressSuggestion {
  place_id: string;
  main_text: string;
  secondary_text: string;
  lat?: number | null;
  lng?: number | null;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (address: string, meta?: { lat?: number | null; lng?: number | null }) => void;
  placeholder?: string;
  pickupAddress?: string;
  className?: string;
  inputClassName?: string;
}

export function AddressAutocomplete({
  value,
  onChange,
  placeholder = "Nhập địa chỉ...",
  pickupAddress,
  className,
  inputClassName,
}: AddressAutocompleteProps) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [sessionToken] = useState(() =>
    typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
  );
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const search = useCallback(
    (input: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        const q = input.trim();
        if (q.length < 2) {
          setSuggestions([]);
          setOpen(false);
          return;
        }
        setLoading(true);
        try {
          const res = await mapsApi.autocomplete(q, sessionToken, {
            pickup_address: pickupAddress || undefined,
          });
          const data = (res.data ?? []) as AddressSuggestion[];
          setSuggestions(Array.isArray(data) ? data : []);
          setOpen(data.length > 0);
        } catch {
          setSuggestions([]);
          setOpen(false);
        } finally {
          setLoading(false);
        }
      }, 320);
    },
    [pickupAddress, sessionToken],
  );

  const select = async (item: AddressSuggestion) => {
    setOpen(false);
    setSuggestions([]);
    try {
      const res = await mapsApi.placeDetails(
        item.place_id,
        sessionToken,
        item.secondary_text ? `${item.main_text}, ${item.secondary_text}` : undefined,
      );
      const d = res.data as { address?: string; lat?: number; lng?: number };
      const addr =
        d?.address ||
        [item.main_text, item.secondary_text].filter(Boolean).join(", ");
      onChange(addr, { lat: d?.lat ?? item.lat, lng: d?.lng ?? item.lng });
    } catch {
      onChange([item.main_text, item.secondary_text].filter(Boolean).join(", "), {
        lat: item.lat,
        lng: item.lng,
      });
    }
  };

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <div ref={wrapRef} className={`relative ${className ?? ""}`}>
      <input
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          search(e.target.value);
        }}
        onFocus={() => value.trim().length >= 2 && suggestions.length > 0 && setOpen(true)}
        placeholder={placeholder}
        autoComplete="off"
        aria-autocomplete="list"
        aria-controls={listId}
        className={
          inputClassName ??
          "w-full h-11 px-4 rounded-xl border border-gray-200 text-sm bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] focus:bg-white transition-all"
        }
      />
      {loading && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">...</span>
      )}
      {open && suggestions.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-50 left-0 right-0 mt-1 max-h-56 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg divide-y divide-gray-50"
        >
          {suggestions.map((s) => (
            <li key={s.place_id}>
              <button
                type="button"
                role="option"
                onClick={() => select(s)}
                className="w-full flex items-start gap-2.5 px-3 py-2.5 text-left hover:bg-blue-50 transition-colors"
              >
                <MapPin size={14} className="text-[#2563EB] shrink-0 mt-0.5" />
                <span>
                  <span className="block text-sm font-medium text-gray-900">{s.main_text}</span>
                  {s.secondary_text && (
                    <span className="block text-xs text-gray-500 truncate">{s.secondary_text}</span>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
