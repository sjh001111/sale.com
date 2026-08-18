"use client";

import { useState } from "react";

export default function CodeButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <button className="codeButton" onClick={copy} aria-label={`${code} 복사`} type="button">
      <span>{code}</span>
      <span className="copyState" aria-live="polite">{copied ? "복사됨" : "복사"}</span>
    </button>
  );
}
