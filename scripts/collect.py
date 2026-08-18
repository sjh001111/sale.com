import json
import os
import re
import time
from datetime import datetime, timedelta
from pathlib import Path
from urllib.parse import urlparse
from zoneinfo import ZoneInfo

import httpx
from google import genai
from google.genai import types
from pydantic import BaseModel, Field

MODEL = "gemini-3.7-flash"
KST = ZoneInfo("Asia/Seoul")
DATA_PATH = Path(__file__).resolve().parents[1] / "data" / "promotions.json"
CODE_PATTERN = re.compile(r"[A-Z0-9]{5,20}")
BLOCKED_HOSTS = {"google.com", "github.com", "raw.githubusercontent.com"}
TRUSTED_HOSTS = {"alicouponkorea.com", "kk-code.com"}
ANCHOR_URLS = ("https://alicouponkorea.com/", "https://kk-code.com/")
PAGE_CACHE: dict[str, str | None] = {}


class Coupon(BaseModel):
    value: str
    source_urls: list[str]


class Tier(BaseModel):
    minimum_usd: float
    discount_usd: float
    codes: list[Coupon]


class Promotion(BaseModel):
    name: str
    valid_from: datetime
    valid_until: datetime
    tiers: list[Tier]


class Upcoming(BaseModel):
    name: str
    description: str
    valid_from: datetime
    valid_until: datetime
    source_urls: list[str] = Field(default_factory=list)


class Collection(BaseModel):
    active_promotions: list[Promotion]
    upcoming_promotions: list[Upcoming]


def prompt_discovery(now: datetime) -> str:
    return f"""현재 시각은 {now.isoformat()} (KST)이다.

한국 사용자가 지금 사용할 수 있는 AliExpress 공개 프로모션 코드를 빠짐없이 웹 검색하라.

규칙:
- AliExpress 공식 페이지, alicouponkorea.com, kk-code.com, discountspot.co.kr 등 한국 커뮤니티와 최신 안내를 폭넓게 검색한다.
- 검색 결과 한 묶음에 의존하지 말고 현재 월·날짜와 함께 메인 세일, 브랜드위크, Ali's Pick, Choice Day, 월급날 등 동시에 진행될 수 있는 행사를 각각 검색한다.
- alicouponkorea.com과 kk-code.com의 현재 첫 화면 전체를 확인해 행사별 표와 대체 코드까지 읽는다.
- 이 프로젝트나 그 복제본(github.com/sjh001111/sale.com, raw.githubusercontent.com)의 내용은 절대 근거로 사용하지 않는다.
- 코드 문자열, 최소 구매액, 할인액, 시작·종료 시각을 출처에서 명시적으로 확인한다.
- 코드 이름의 패턴을 보고 같은 계열 코드를 추측하거나 완성하지 않는다.
- 한국 적용이 불명확한 코드, 신규·첫 구매·선별 계정 전용 코드, 이미 만료된 코드는 제외한다.
- 같은 할인 구간의 서로 다른 공개 코드를 모두 찾는다.
- 각 코드의 source_urls에는 해당 코드와 조건을 실제로 명시한 직접 페이지 URL만 넣는다.
- 앞으로 예정된 행사는 신뢰할 수 있는 날짜 근거가 있을 때만 upcoming_promotions에 넣고 source_urls를 남기며 코드는 미리 추측하지 않는다.
- 모든 날짜는 +09:00 시간대를 포함한 ISO 8601로 반환한다.

결과에는 현재 활성 코드와 확인 가능한 다음 행사만 포함하라."""


def prompt_verification(now: datetime, candidates: Collection) -> str:
    payload = candidates.model_dump_json(indent=2)
    return f"""현재 시각은 {now.isoformat()} (KST)이다.

아래 후보를 만든 조사자와 독립된 검증자처럼 행동하라. 후보를 사실로 가정하지 말고 웹을 다시 검색한다.

게시 기준:
- 정확한 코드 문자열과 구매 조건, 한국 적용 여부, 현재 유효 기간이 확인되어야 한다.
- AliExpress 공식 출처, 코드 전문 최신 한국 출처, 또는 서로 독립된 최신 출처들이 같은 내용을 뒷받침해야 한다.
- source_urls에는 검증에 실제 사용한 직접 URL만 남긴다.
- 검색 스니펫만 모호하게 언급하거나 날짜가 과거인 페이지는 근거가 아니다.
- 코드 패턴에서 파생한 값, 출처에 없는 값, 첫 구매·선별 계정 전용 코드는 제거한다.
- 검증되지 않은 후보를 살리기보다 제거한다.
- 누락된 현재 코드를 새로 발견하면 같은 기준으로 검증한 뒤 추가할 수 있다.
- 후보에 한 행사만 있더라도 메인 세일, 브랜드위크, Ali's Pick, Choice Day, 월급날 등 다른 동시 행사가 없는지 별도로 확인한다.
- 모든 날짜는 +09:00 시간대를 포함한 ISO 8601로 반환한다.

후보:
{payload}
"""


def ask(client: genai.Client, prompt: str) -> Collection:
    config = types.GenerateContentConfig(
        response_mime_type="application/json",
        response_schema=Collection.model_json_schema(),
        tools=[types.Tool(google_search=types.GoogleSearch())],
    )
    error = None
    for attempt in range(3):
        try:
            response = client.chats.create(model=MODEL, config=config).send_message(prompt)
            if not response.text:
                raise RuntimeError("Gemini returned an empty response")
            usage = response.usage_metadata
            if usage:
                print(f"Gemini tokens: input={usage.prompt_token_count or 0}, output={usage.candidates_token_count or 0}, thinking={usage.thoughts_token_count or 0}, total={usage.total_token_count or 0}")
            return Collection.model_validate_json(response.text)
        except Exception as exc:  # API and schema errors are retried together.
            error = exc
            if attempt < 2:
                time.sleep(4 * (attempt + 1))
    raise RuntimeError(f"Gemini request failed after 3 attempts: {error}")


def domain(url: str) -> str | None:
    try:
        host = (urlparse(url).hostname or "").lower().removeprefix("www.")
    except ValueError:
        return None
    if not host or any(host == blocked or host.endswith(f".{blocked}") for blocked in BLOCKED_HOSTS):
        return None
    return host


def page_text(url: str) -> str | None:
    if url in PAGE_CACHE:
        return PAGE_CACHE[url]
    for attempt in range(2):
        try:
            response = httpx.get(
                url,
                follow_redirects=True,
                timeout=15,
                headers={"User-Agent": "Mozilla/5.0 (compatible; SaleDotComVerifier/1.0)"},
            )
            response.raise_for_status()
            PAGE_CACHE[url] = response.text.upper()
            return PAGE_CACHE[url]
        except (httpx.HTTPError, ValueError):
            if attempt == 0:
                time.sleep(1)
    PAGE_CACHE[url] = None
    return None


def clean_sources(urls: list[str], code: str) -> list[str]:
    anchors = [url for url in ANCHOR_URLS if (content := page_text(url)) and code in content]
    if anchors:
        return anchors

    cleaned: list[str] = []
    domains: set[str] = set()
    for url in urls:
        host = domain(url)
        content = page_text(url) if host and url.startswith(("https://", "http://")) else None
        if content and code in content and url not in cleaned:
            cleaned.append(url)
            domains.add(host)
    official = any(host == "aliexpress.com" or host.endswith(".aliexpress.com") for host in domains)
    trusted = any(host in TRUSTED_HOSTS for host in domains)
    return cleaned if official or trusted or len(domains) >= 2 else []


def clean_event_sources(urls: list[str]) -> list[str]:
    cleaned: list[str] = []
    domains: set[str] = set()
    for url in urls:
        host = domain(url)
        if host and page_text(url) and url not in cleaned:
            cleaned.append(url)
            domains.add(host)
    official = any(host == "aliexpress.com" or host.endswith(".aliexpress.com") for host in domains)
    trusted = any(host in TRUSTED_HOSTS for host in domains)
    return cleaned if official or trusted or len(domains) >= 2 else []


def canonicalize(result: Collection, now: datetime) -> Collection:
    active: list[Promotion] = []
    seen_codes: set[str] = set()

    for promotion in result.active_promotions:
        if not (promotion.valid_from.tzinfo and promotion.valid_until.tzinfo):
            continue
        if not (promotion.valid_from <= now <= promotion.valid_until):
            continue
        tiers: list[Tier] = []
        for tier in sorted(promotion.tiers, key=lambda item: (item.minimum_usd, item.discount_usd)):
            if tier.minimum_usd <= 0 or tier.discount_usd <= 0 or tier.discount_usd >= tier.minimum_usd:
                continue
            codes: list[Coupon] = []
            for coupon in tier.codes:
                value = coupon.value.strip().upper()
                sources = sorted(clean_sources(coupon.source_urls, value))
                if CODE_PATTERN.fullmatch(value) and value not in seen_codes and sources:
                    codes.append(Coupon(value=value, source_urls=sources))
                    seen_codes.add(value)
            if codes:
                codes.sort(key=lambda item: item.value)
                tiers.append(Tier(minimum_usd=tier.minimum_usd, discount_usd=tier.discount_usd, codes=codes))
        if tiers:
            active.append(Promotion(name=promotion.name.strip(), valid_from=promotion.valid_from, valid_until=promotion.valid_until, tiers=tiers))
    active.sort(
        key=lambda item: (
            item.valid_from,
            item.valid_until,
            tuple(coupon.value for tier in item.tiers for coupon in tier.codes),
        )
    )

    upcoming: list[Upcoming] = []
    seen_events: set[tuple[datetime, datetime]] = set()
    for event in sorted(result.upcoming_promotions, key=lambda item: item.valid_from):
        key = (event.valid_from, event.valid_until)
        sources = clean_event_sources(event.source_urls)
        if event.valid_from.tzinfo and event.valid_until.tzinfo and event.valid_from > now and event.valid_until > event.valid_from and key not in seen_events and sources:
            upcoming.append(event.model_copy(update={"source_urls": sorted(sources)}))
            seen_events.add(key)

    return Collection(active_promotions=active, upcoming_promotions=upcoming)


def code_count(collection: Collection) -> int:
    return sum(len(tier.codes) for promotion in collection.active_promotions for tier in promotion.tiers)


def merge_verified(previous: Collection, current: Collection) -> Collection:
    merged = previous.model_copy(deep=True)
    seen = {coupon.value for promotion in merged.active_promotions for tier in promotion.tiers for coupon in tier.codes}

    for promotion in current.active_promotions:
        values = {coupon.value for tier in promotion.tiers for coupon in tier.codes}
        target = next(
            (
                item
                for item in merged.active_promotions
                if values & {coupon.value for tier in item.tiers for coupon in tier.codes}
                or (
                    item.valid_from == promotion.valid_from
                    and item.valid_until == promotion.valid_until
                    and item.name.strip().casefold() == promotion.name.strip().casefold()
                )
            ),
            None,
        )
        if target is None:
            tiers = []
            for tier in promotion.tiers:
                codes = [coupon for coupon in tier.codes if coupon.value not in seen]
                if codes:
                    tiers.append(tier.model_copy(update={"codes": codes}, deep=True))
                    seen.update(coupon.value for coupon in codes)
            if tiers:
                merged.active_promotions.append(promotion.model_copy(update={"tiers": tiers}, deep=True))
            continue

        for tier in promotion.tiers:
            target_tier = next(
                (item for item in target.tiers if item.minimum_usd == tier.minimum_usd and item.discount_usd == tier.discount_usd),
                None,
            )
            if target_tier is None:
                new_codes = [coupon for coupon in tier.codes if coupon.value not in seen]
                if new_codes:
                    target.tiers.append(tier.model_copy(update={"codes": new_codes}, deep=True))
                    seen.update(coupon.value for coupon in new_codes)
                continue
            for coupon in tier.codes:
                if coupon.value not in seen:
                    target_tier.codes.append(coupon.model_copy(deep=True))
                    seen.add(coupon.value)

    upcoming_keys = {(event.valid_from, event.valid_until) for event in merged.upcoming_promotions}
    for event in current.upcoming_promotions:
        key = (event.valid_from, event.valid_until)
        if key not in upcoming_keys:
            merged.upcoming_promotions.append(event.model_copy(deep=True))
            upcoming_keys.add(key)
    return merged


def load_existing() -> dict:
    try:
        return json.loads(DATA_PATH.read_text(encoding="utf-8"))
    except (FileNotFoundError, json.JSONDecodeError):
        return {}


def fingerprint(collection: Collection) -> dict:
    return {
        "active": [
            {
                "from": promotion.valid_from.isoformat(),
                "until": promotion.valid_until.isoformat(),
                "tiers": [
                    {
                        "minimum": tier.minimum_usd,
                        "discount": tier.discount_usd,
                        "codes": [(coupon.value, tuple(sorted(coupon.source_urls))) for coupon in tier.codes],
                    }
                    for tier in promotion.tiers
                ],
            }
            for promotion in collection.active_promotions
        ],
        "upcoming": [
            (event.name.strip().casefold(), event.valid_from.isoformat(), event.valid_until.isoformat(), tuple(sorted(event.source_urls)))
            for event in collection.upcoming_promotions
        ],
    }


def save_if_changed(result: Collection, now: datetime) -> bool:
    existing = load_existing()
    if existing.get("schema_version") == 2:
        old = Collection.model_validate(existing)
        if fingerprint(old) == fingerprint(result):
            print("No material changes; keeping the existing file.")
            return False
        old_count = code_count(old)
        old_still_active = any(promotion.valid_until > now + timedelta(hours=12) for promotion in old.active_promotions)
        if old_still_active and old_count >= 4 and code_count(result) < old_count * 0.3:
            raise RuntimeError("Safety stop: more than 70% of still-active codes disappeared")

    output = {"schema_version": 2, "last_updated": now.isoformat(), "model": MODEL, **result.model_dump(mode="json")}
    temporary = DATA_PATH.with_suffix(".json.tmp")
    temporary.write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    temporary.replace(DATA_PATH)
    return True


def main() -> None:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY is required")

    now = datetime.now(KST).replace(microsecond=0)
    client = genai.Client(api_key=api_key)
    existing = load_existing()
    previous = Collection(active_promotions=[], upcoming_promotions=[])
    if existing.get("schema_version") == 2:
        previous = canonicalize(Collection.model_validate(existing), now)

    print(f"Discovering current Korean coupons with {MODEL}...")
    candidates = ask(client, prompt_discovery(now))
    print(f"Discovered {code_count(candidates)} candidates; verifying independently...")
    fresh = canonicalize(ask(client, prompt_verification(now, candidates)), now)
    verified = canonicalize(merge_verified(previous, fresh), now)
    if code_count(verified) == 0:
        raise RuntimeError("Safety stop: verification returned no active coupon codes")
    changed = save_if_changed(verified, now)
    print(f"Verified {code_count(verified)} codes across {len(verified.active_promotions)} promotions. Changed={changed}")


if __name__ == "__main__":
    main()
