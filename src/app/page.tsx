import fs from "node:fs";
import path from "node:path";
import CodeButton from "./CodeButton";

export const dynamic = "force-dynamic";

const AFFILIATE_URL = "https://www.aliexpress.com/";

type Coupon = { value: string; source_urls: string[] };
type Tier = { minimum_usd: number; discount_usd: number; codes: Coupon[] };
type Promotion = { name: string; valid_from: string; valid_until: string; tiers: Tier[] };
type Upcoming = { name: string; description: string; valid_from: string; valid_until: string };
type SiteData = {
  last_updated: string;
  active_promotions: Promotion[];
  upcoming_promotions: Upcoming[];
};

const date = new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", month: "short", day: "numeric" });
const dateTime = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  month: "long",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function loadData(): SiteData {
  return JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "promotions.json"), "utf8"));
}

function sourceName(url: string) {
  return new URL(url).hostname.replace(/^www\./, "");
}

export default function Home() {
  const data = loadData();
  // This server component must evaluate expiry against the current request time.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const active = data.active_promotions.filter(
    (promotion) => Date.parse(promotion.valid_from) <= now && now <= Date.parse(promotion.valid_until),
  );
  const upcoming = data.upcoming_promotions.filter((promotion) => Date.parse(promotion.valid_until) > now);
  const codeCount = active.reduce(
    (promotions, promotion) => promotions + promotion.tiers.reduce((tiers, tier) => tiers + tier.codes.length, 0),
    0,
  );
  const sourceCount = new Set(
    active.flatMap((promotion) => promotion.tiers.flatMap((tier) => tier.codes.flatMap((code) => code.source_urls))),
  ).size;

  return (
    <>
      <header className="siteHeader">
        <a className="brand" href="#top" aria-label="세일닷컴 홈">세일닷컴<span>.</span></a>
        <a className="headerLink" href={AFFILIATE_URL} target="_blank" rel="sponsored noopener noreferrer">
          알리 바로가기 <span aria-hidden="true">↗</span>
        </a>
      </header>

      <main id="top">
        <section className="hero shell">
          <div className="heroCopy">
            <p className="eyebrow"><span /> 한국 전용 코드 교차 확인</p>
            <h1>할인코드,<br /><em>되는 것만.</em></h1>
            <p className="heroDescription">
              흩어진 알리익스프레스 할인코드를 찾아 현재 기간과 구매 조건까지 다시 확인합니다.
            </p>
          </div>
          <div className="statusCard" aria-label="현재 코드 현황">
            <div><strong>{codeCount}</strong><span>사용 가능 코드</span></div>
            <div><strong>{active.length}</strong><span>진행 중 행사</span></div>
            <div><strong>{sourceCount}</strong><span>확인된 출처</span></div>
            <p>마지막 변경 {dateTime.format(new Date(data.last_updated))}</p>
          </div>
        </section>

        <section className="shell content" aria-labelledby="active-title">
          <div className="sectionHeading">
            <div>
              <p className="sectionNumber">01</p>
              <h2 id="active-title">지금 사용 가능</h2>
            </div>
            <p>코드를 누르면 바로 복사됩니다.</p>
          </div>

          {active.length ? active.map((promotion) => (
            <article className="promotion" key={`${promotion.name}-${promotion.valid_until}`}>
              <div className="promotionHeader">
                <div>
                  <p className="liveLabel"><span /> 진행 중</p>
                  <h3>{promotion.name}</h3>
                </div>
                <p className="period">{date.format(new Date(promotion.valid_from))} — {date.format(new Date(promotion.valid_until))}</p>
              </div>

              <div className="tierGrid">
                {promotion.tiers.map((tier) => {
                  const sources = [...new Set(tier.codes.flatMap((code) => code.source_urls))];
                  return (
                    <section className="tier" key={`${tier.minimum_usd}-${tier.discount_usd}`}>
                      <div className="discount">
                        <span>US $</span><strong>{tier.discount_usd}</strong><b>할인</b>
                      </div>
                      <p className="minimum">US ${tier.minimum_usd} 이상 구매 시</p>
                      <div className="codes">
                        {tier.codes.map((code) => <CodeButton code={code.value} key={code.value} />)}
                      </div>
                      <div className="sources" aria-label="확인 출처">
                        <span>확인</span>
                        {sources.slice(0, 3).map((url) => (
                          <a href={url} target="_blank" rel="noopener noreferrer" key={url}>{sourceName(url)}</a>
                        ))}
                        {sources.length > 3 && <small>+{sources.length - 3}</small>}
                      </div>
                    </section>
                  );
                })}
              </div>
            </article>
          )) : (
            <div className="emptyState">
              <p>현재 교차 확인된 공개 코드가 없습니다.</p>
              <span>새 코드가 확인되는 대로 자동으로 업데이트됩니다.</span>
            </div>
          )}
        </section>

        {upcoming.length > 0 && (
          <section className="shell upcoming" aria-labelledby="upcoming-title">
            <div className="sectionHeading">
              <div>
                <p className="sectionNumber">02</p>
                <h2 id="upcoming-title">다음 할인 일정</h2>
              </div>
            </div>
            <div className="timeline">
              {upcoming.map((promotion) => (
                <article key={`${promotion.name}-${promotion.valid_from}`}>
                  <time>{date.format(new Date(promotion.valid_from))} — {date.format(new Date(promotion.valid_until))}</time>
                  <h3>{promotion.name}</h3>
                  <p>{promotion.description}</p>
                </article>
              ))}
            </div>
          </section>
        )}

        <section className="cta shell">
          <div><p>코드를 복사했다면</p><h2>할인받으러 갈 시간.</h2></div>
          <a href={AFFILIATE_URL} target="_blank" rel="sponsored noopener noreferrer">알리익스프레스 열기 <span>↗</span></a>
        </section>
      </main>

      <footer className="siteFooter shell">
        <p>© {new Date(now).getFullYear()} 세일닷컴</p>
        <p>코드는 예고 없이 소진되거나 계정별로 적용 조건이 달라질 수 있습니다. 일부 링크를 통해 수수료를 받을 수 있습니다.</p>
      </footer>
    </>
  );
}
