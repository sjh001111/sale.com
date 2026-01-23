"use client";

const AFFILIATE_URL = "https://www.aliexpress.com/";

export function AffiliateButtonHeader() {
  return (
    <a
      href={AFFILIATE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 bg-white text-red-600 px-5 py-2.5 rounded-full font-bold text-sm shadow hover:bg-red-50 transition-colors"
    >
      알리익스프레스 바로가기
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
      </svg>
    </a>
  );
}

export function AffiliateButtonFloating() {
  return (
    <a
      href={AFFILIATE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-linear-to-r from-red-600 to-orange-500 text-white px-6 py-4 rounded-full font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
      알리 쇼핑하기
    </a>
  );
}
