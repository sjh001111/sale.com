import fs from "fs";
import path from "path";
import CopyButton from "./CopyButton";

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

interface CurrentPaymentPromotion {
  payment_method: string;
  min_purchase: string;
  discount_amount: string;
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
  active_payment_promotions: CurrentPaymentPromotion[];
  upcoming_promotions: UpcomingPromotion[];
}

function getPromotions(): Promotions {
  const filePath = path.join(process.cwd(), "data", "promotions.json");
  const fileContents = fs.readFileSync(filePath, "utf8");
  return JSON.parse(fileContents);
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("ko-KR", { month: "long", day: "numeric" });
}

function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("ko-KR", {
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

          <p className="mt-4 text-white/70 text-sm">
            마지막 업데이트: {formatDateTime(data.last_updated)}
          </p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Code Promotions */}
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          🎫 프로모션 코드
          <span className="text-sm font-normal text-gray-500">
            (클릭하여 코드 복사)
          </span>
        </h2>

        {data.active_code_promotions.map((promo, promoIdx) => (
          <section key={promoIdx} className="mb-10">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border-l-8 border-red-500">
              <div className="p-6">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    진행중
                  </span>
                  <span className="text-gray-500 text-sm">
                    {formatDate(promo.valid_from)} ~ {formatDate(promo.valid_until)}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{promo.name}</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {promo.codes.map((code, codeIdx) => (
                    <div
                      key={codeIdx}
                      className="border-2 border-dashed border-gray-200 rounded-xl p-4 hover:border-orange-400 transition-colors bg-white"
                    >
                      <p className="text-sm text-gray-500 mb-1">
                        {code.min_purchase} 이상 구매 시
                      </p>
                      <p className="text-2xl font-black text-red-600 mb-3">
                        {code.discount_amount} 할인
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

        {/* Payment Promotions */}
        {data.active_payment_promotions.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              💳 결제 혜택
            </h2>
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              {data.active_payment_promotions.map((payment, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-4 p-4 border-b last:border-b-0 border-gray-100"
                >
                  <span className="bg-blue-600 text-white font-bold px-3 py-1 rounded text-sm min-w-[90px] text-center">
                    {payment.payment_method}
                  </span>
                  <span className="text-gray-700">
                    {payment.min_purchase} 이상 결제 시{" "}
                    <strong className="text-blue-600">{payment.discount_amount} 할인</strong>
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Upcoming Promotions */}
        {data.upcoming_promotions.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              📅 다가오는 프로모션
            </h2>
            <div className="bg-gray-900 rounded-2xl p-6 shadow-lg">
              <div className="space-y-6">
                {data.upcoming_promotions.map((upcoming, idx) => (
                  <div key={idx} className="flex items-start gap-4">
                    <div className="bg-orange-500 text-white px-3 py-2 rounded-lg font-bold text-center min-w-[80px] text-sm">
                      {new Date(upcoming.valid_from).toLocaleDateString("ko-KR", {
                        month: "2-digit",
                        day: "2-digit",
                      })}
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg">{upcoming.name}</h3>
                      <p className="text-gray-400 text-sm mt-1">{upcoming.description}</p>
                      <p className="text-gray-500 text-xs mt-1">
                        {formatDate(upcoming.valid_from)} ~ {formatDate(upcoming.valid_until)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="bg-gray-100 py-10 text-center text-gray-500 text-sm">
        <p>AI가 자동으로 수집한 프로모션 정보입니다.</p>
        <p className="mt-1">실제 혜택은 알리익스프레스 상황에 따라 변동될 수 있습니다.</p>
        <p className="mt-4 text-gray-400">© 2026 세일닷컴</p>
      </footer>
    </div>
  );
}
