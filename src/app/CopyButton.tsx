"use client";

import { useState } from "react";

const AFFILIATE_URL = "https://www.aliexpress.com/";

export default function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);

    // 알리익스프레스 창 열기
    window.open(AFFILIATE_URL, "_blank");

    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className={`
        min-w-[100px] px-3 py-1.5 rounded border text-sm font-mono font-bold transition-all cursor-pointer
        ${copied
          ? "bg-green-500 text-white border-green-500"
          : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-orange-500 hover:text-white hover:border-orange-500"
        }
      `}
    >
      {copied ? "복사됨!" : code}
    </button>
  );
}
