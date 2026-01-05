import fs from "fs";
import path from "path";
import CopyButton from "./CopyButton";

interface PromoCode {
  id: string;
  code: string;
  title: string;
  discountAmount: string;
  minPurchase: string;
  validFrom: string;
  validUntil: string;
  category: string;
}

interface PromoData {
  lastUpdated: string;
  codes: PromoCode[];
}

function getPromoCodes(): PromoData {
  const filePath = path.join(process.cwd(), "data", "promo-codes.json");
  const fileContents = fs.readFileSync(filePath, "utf8");
  return JSON.parse(fileContents);
}

function CopyButton({ code }: { code: string }) {
  return (
    <button
      onClick={() => navigator.clipboard.writeText(code)}
      className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-bold transition-colors"
    >
      {code} 복사
    </button>
  );
}

export default function Home() {
  const data = getPromoCodes();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-orange-500 text-white py-6">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl font-bold">세일닷컴</h1>
          <p className="text-orange-100 mt-1">알리익스프레스 프로모션 코드 모음</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">현재 사용 가능한 코드</h2>
          <span className="text-sm text-gray-500">
            업데이트: {new Date(data.lastUpdated).toLocaleDateString("ko-KR")}
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {data.codes.map((promo) => (
            <div
              key={promo.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-5"
            >
              <div className="flex justify-between items-start mb-3">
                <span className="bg-orange-100 text-orange-700 text-xs font-medium px-2 py-1 rounded">
                  {promo.category}
                </span>
                <span className="text-2xl font-bold text-orange-500">
                  {promo.discountAmount}
                </span>
              </div>

              <h3 className="font-bold text-gray-900 mb-2">{promo.title}</h3>

              <div className="text-sm text-gray-600 mb-4">
                <p>최소 구매: {promo.minPurchase}</p>
                <p>
                  기간: {promo.validFrom} ~ {promo.validUntil}
                </p>
              </div>

              <div className="bg-gray-100 rounded-lg p-3 flex justify-between items-center">
                <code className="font-mono text-lg font-bold text-gray-800">
                  {promo.code}
                </code>
                <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors">
                  복사
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      <footer className="bg-gray-100 py-6 mt-12">
        <div className="max-w-4xl mx-auto px-4 text-center text-gray-500 text-sm">
          <p>AI가 자동으로 수집한 프로모션 코드입니다. 사용 전 유효성을 확인하세요.</p>
        </div>
      </footer>
    </div>
  );
}
