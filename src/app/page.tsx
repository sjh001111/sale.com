import fs from "node:fs";
import path from "node:path";
import CodeButton from "./CodeButton";

export const dynamic = "force-dynamic";

const AFFILIATE_URL = "https://www.aliexpress.com/";

type Coupon = { value: string };
type Tier = { minimum_usd: number; discount_usd: number; codes: Coupon[] };
type Promotion = { name: string; valid_from: string; valid_until: string; tiers: Tier[] };
type Upcoming = { name: string; description: string; valid_from: string; valid_until: string };
type SiteData = {
  last_updated: string;
  active_promotions: Promotion[];
  upcoming_promotions: Upcoming[];
};

const shortDate = new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", month: "numeric", day: "numeric" });
const updatedAt = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  month: "numeric",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function loadData(): SiteData {
  return JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "promotions.json"), "utf8"));
}

function countCodes(promotion: Promotion) {
  return promotion.tiers.reduce((total, tier) => total + tier.codes.length, 0);
}

export default function Home() {
  const data = loadData();
  // This server component must evaluate expiry against the current request time.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const active = data.active_promotions
    .filter((promotion) => Date.parse(promotion.valid_from) <= now && now <= Date.parse(promotion.valid_until))
    .sort((a, b) => countCodes(b) - countCodes(a));
  const upcoming = data.upcoming_promotions
    .filter((promotion) => Date.parse(promotion.valid_until) > now)
    .sort((a, b) => Date.parse(a.valid_from) - Date.parse(b.valid_from));
  const codeCount = active.reduce((total, promotion) => total + countCodes(promotion), 0);

  return (
    <>
      <header className="topBar">
        <div className="shell topBarInner">
          <a className="brand" href="#top" aria-label="세일닷컴 홈">세일닷컴<span>.</span></a>
          <div className="headerActions">
            <p>변경 {updatedAt.format(new Date(data.last_updated))}</p>
            <a href={AFFILIATE_URL} target="_blank" rel="sponsored noopener noreferrer">
              알리 열기 <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
      </header>

      <main className="shell" id="top">
        <section className="overview" aria-labelledby="page-title">
          <div>
            <p className="liveSummary"><span /> 한국 적용 코드 확인 중</p>
            <h1 id="page-title">지금 되는 할인코드 <strong>{codeCount}개</strong></h1>
          </div>
          <p><b>{active.length}개 행사</b> · 구매 조건별 코드 클릭 복사</p>
        </section>

        {active.length > 0 ? (
          <section className="promotionGrid" aria-label="현재 사용 가능한 할인코드">
            {active.map((promotion) => (
              <article className="promotionCard" key={`${promotion.name}-${promotion.valid_until}`}>
                <header className="cardHeader">
                  <div className="cardMeta">
                    <span>LIVE</span>
                    <time>{shortDate.format(new Date(promotion.valid_from))}–{shortDate.format(new Date(promotion.valid_until))}</time>
                  </div>
                  <h2>{promotion.name}</h2>
                </header>

                <div className="tierList">
                  {promotion.tiers.map((tier) => (
                    <section className="tierRow" key={`${tier.minimum_usd}-${tier.discount_usd}`}>
                      <div className="deal">
                        <strong>${tier.discount_usd}</strong><span>할인</span>
                        <small>${tier.minimum_usd} 이상</small>
                      </div>
                      <div className="codes">
                        {tier.codes.map((code) => <CodeButton code={code.value} key={code.value} />)}
                      </div>
                    </section>
                  ))}
                </div>
              </article>
            ))}
          </section>
        ) : (
          <section className="emptyState">
            <h2>현재 확인된 공개 코드가 없습니다.</h2>
            <p>새 코드가 확인되는 대로 자동으로 표시됩니다.</p>
          </section>
        )}

        {upcoming.length > 0 && (
          <aside className="nextSale" aria-label="다음 할인 일정">
            <span>다음 할인</span>
            <strong>{upcoming[0].name}</strong>
            <time>{shortDate.format(new Date(upcoming[0].valid_from))}–{shortDate.format(new Date(upcoming[0].valid_until))}</time>
            <p>{upcoming[0].description}</p>
          </aside>
        )}
      </main>

      <footer className="shell footer">
        <p>© {new Date(now).getFullYear()} 세일닷컴</p>
        <p>코드는 소진되거나 계정별 조건이 다를 수 있습니다. 일부 링크를 통해 수수료를 받을 수 있습니다.</p>
      </footer>
    </>
  );
}
