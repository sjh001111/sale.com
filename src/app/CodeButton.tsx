"use client";

import { useState } from "react";

export default function CodeButton({ code, href }: { code: string; href: string }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    void navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    }).catch(() => undefined);
  }

  return (
    <a
      className="codeButton"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={copy}
      aria-label={`${code} 복사하고 알리익스프레스 열기`}
    >
      <span>{code}</span>
      <span className="copyState" aria-live="polite">{copied ? "복사됨" : "복사"}</span>
    </a>
  );
}
