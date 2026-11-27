"use client";

import { useEffect, useState } from "react";

interface CaptchaBoxProps {
  value: string;
  onChange: (val: string) => void;
  onCodeChange?: (generatedCode: string) => void;
  refreshTrigger?: number;
}

const CAPTCHA_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateCaptchaCode(length = 5): string {
  let result = "";
  for (let i = 0; i < length; i++) {
    const idx = Math.floor(Math.random() * CAPTCHA_CHARS.length);
    result += CAPTCHA_CHARS[idx];
  }
  return result;
}

export default function CaptchaBox({
  value,
  onChange,
  onCodeChange,
  refreshTrigger = 0,
}: CaptchaBoxProps) {
  const [captchaCode, setCaptchaCode] = useState("");

  const refreshCaptcha = () => {
    const nextCode = generateCaptchaCode(5);
    setCaptchaCode(nextCode);
    onChange("");
    onCodeChange?.(nextCode);
  };

  useEffect(() => {
    refreshCaptcha();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger]);

  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold text-slate-700">
        Security Captcha (Case-Insensitive)
      </label>

      <div className="flex items-center gap-2.5">
        <div
          aria-label="Captcha code"
          className="select-none px-4 py-2.5 rounded-xl bg-slate-100 border border-slate-300 font-mono text-base font-extrabold tracking-[0.28em] text-slate-800 italic line-through decoration-slate-400/50"
        >
          {captchaCode || "-----"}
        </div>

        <button
          type="button"
          onClick={refreshCaptcha}
          title="Refresh Captcha"
          className="px-3 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition cursor-pointer"
        >
          ↻ Refresh
        </button>
      </div>

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter captcha shown above"
        autoComplete="off"
        className="w-full rounded-xl border border-slate-300 bg-slate-50 focus:bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
      />
    </div>
  );
}