import fs from "fs";
import path from "path";
import CopyButton from "./CopyButton";
import { AffiliateButtonHeader, AffiliateButtonFloating } from "./AffiliateButton";

// Types matching models.py
interface Code {
  min_purchase: string;
  discount_amount: string;
  codes: string[];
}

interface CurrentCodePromotion {
  name: string;
  valid_from: string;
  valid_until: string;
  codes: Code[];
}

interface UpcomingPromotion {
  name: string;
  description: string;
  valid_from: string;
  valid_until: string;
}

interface Promotions {
  last_updated: string;
  active_code_promotions: CurrentCodePromotion[];
  upcoming_promotions: UpcomingPromotion[];
}

function getPromotions(): Promotions {
  const filePath = path.join(process.cwd(), "data", "promotions.json");
  const fileContents = fs.readFileSync(filePath, "utf8");
  return JSON.parse(fileContents);
}

function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Home() {
  const data = getPromotions();
  const currentPromo = data.active_code_promotions[0];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-red-600 to-orange-500 text-white py-8 shadow-lg">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-black mb-2">세일닷컴</h1>
          <p className="text-lg text-white/90">알리익스프레스 프로모션 코드 & 할인 정보</p>

          {currentPromo && (
            <div className="mt-4 inline-block bg-white text-red-600 px-4 py-2 rounded-full font-bold text-sm shadow">
              🔥 {currentPromo.name} 진행 중
            </div>
          )}

          <div className="mt-4">
            <AffiliateButtonHeader />
          </div>

          <p className="mt-3 text-white/70 text-sm">
            마지막 업데이트: {formatDateTime(data.last_updated)}
          </p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Code Promotions */}
        {data.active_code_promotions.map((promo, promoIdx) => (
          <section key={promoIdx} className="mb-6">
            {/* 진행 중인 이벤트 - 이벤트 정보 */}
            <div className="bg-white rounded-2xl shadow-md overflow-hidden">
              <div className="bg-red-50 border border-red-200 rounded-t-2xl p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4 border-l-4 border-red-500 pl-3">진행 중인 이벤트</h2>
                <h3 className="text-xl font-bold text-red-500 mb-3">{promo.name}</h3>
                <p className="text-gray-700 mb-3">
                  📅 기간: {promo.valid_from.split("T")[0]} ~ {promo.valid_until.split("T")[0]}
                </p>
                <p className="text-red-500 font-medium">
                  ⏳ 종료까지 약 {Math.ceil((new Date(promo.valid_until).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}일 남았습니다!
                </p>
              </div>

              {/* 프로모션 코드 */}
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-1 border-l-4 border-red-500 pl-3">
                  🎫 프로모션 코드
                </h2>
                <p className="text-sm text-gray-500 mb-4">
                  클릭하여 코드 복사
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {promo.codes.map((code, codeIdx) => (
                    <div
                      key={codeIdx}
                      className="border-2 border-dashed border-gray-200 rounded-xl p-4 hover:border-red-400 hover:shadow-md transition-all bg-white"
                    >
                      <p className="text-2xl font-black text-red-500 mb-1">
                        {code.discount_amount} 할인
                      </p>
                      <p className="text-sm text-gray-500 mb-3">
                        {code.min_purchase} 이상 구매 시
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {code.codes.map((c, idx) => (
                          <CopyButton key={idx} code={c} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        ))}

        {/* Upcoming Promotions - Timeline Style */}
        {data.upcoming_promotions.length > 0 && (
          <section className="mb-6">
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6 border-l-4 border-red-500 pl-3">
                📅 다가오는 세일 일정
              </h2>

              {/* Timeline */}
              <div className="border-l-2 border-gray-200 ml-2 pl-6 space-y-6">
                {data.upcoming_promotions.map((upcoming, idx) => (
                  <div key={idx} className="relative">
                    {/* Timeline dot */}
                    <div className="absolute -left-8 top-1 w-3 h-3 bg-orange-500 rounded-full ring-2 ring-white shadow" />

                    <p className="text-sm text-gray-500 font-medium">
                      {upcoming.valid_from.split("T")[0].replace(/-/g, ".")} ~ {upcoming.valid_until.split("T")[0].slice(5).replace(/-/g, ".")}
                    </p>
                    <h3 className="font-bold text-gray-800 mt-1">{upcoming.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{upcoming.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="bg-gray-100 py-10 text-center text-gray-400 text-sm space-y-1">
        <p>© 2026 세일닷컴</p>
        <p>일부 링크를 통해 구매 시 사이트 운영에 도움이 되는 수수료를 받을 수 있습니다.</p>
      </footer>

      <AffiliateButtonFloating />
    </div>
  );
}
