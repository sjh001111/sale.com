import json
import os
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

from dotenv import load_dotenv
from models import Promotions
from google import genai
from google.genai import types

# .env.local 파일 로드
env_path = Path(__file__).parent.parent / ".env.local"
load_dotenv(env_path)

DATA_PATH = Path(__file__).parent.parent / "data" / "promotions.json"


def get_current_time_kst() -> str:
    """현재 KST 시각을 반환"""
    return datetime.now(ZoneInfo("Asia/Seoul")).strftime("%Y-%m-%d %H:%M KST")


def load_existing_promotions() -> str:
    """기존 promotions.json 로드"""
    if DATA_PATH.exists():
        with open(DATA_PATH, "r", encoding="utf-8") as f:
            return f.read()
    return "{}"


def build_prompt(existing_data: str, current_time: str) -> str:
    """프롬프트 생성"""
    return f"""현재 시각: {current_time}

## 기존 수집 데이터
```json
{existing_data}
```

## 요청사항
현재 한국에서 사용 가능한 알리익스프레스(AliExpress) 프로모션 코드를 검색하고, 위 기존 데이터와 병합하여 업데이트해주세요.

### 1. 프로모션 코드 검색 (핵심!)
- 현재 진행 중인 알리익스프레스 한국 프로모션 코드를 웹에서 검색하세요
- https://alicouponkorea.com/ 사이트를 반드시 확인하세요
- 각 프로모션의 모든 할인 구간($20/$2, $56/$6, $135/$14, $348/$35 등)을 빠짐없이 찾으세요
- 같은 할인 구간에 여러 코드가 있으면 모두 찾아서 codes 배열에 포함하세요

### 2. 기존 데이터 검증
- valid_until이 현재 시각 이전인 프로모션은 제거
- 여전히 유효한 프로모션은 유지
- 기존에 없던 새로운 코드가 있으면 추가
- 기존 코드는 기본적으로 유지하되, 허위/무효로 확인된 코드만 제거

### 3. 한국 전용 코드만 포함
- 한국 사용자 전용 코드: PAYDAY, HNYPD, FSKR, CLIEN, PPOM, KR 접미사 등
- 제외: 해외 전용 코드, 신규가입 전용, 앱 첫 구매 전용 코드

### 4. 향후 프로모션 일정
- 예정된 세일 일정(초이스데이, 브랜드데이, 페이데이 등)도 검색
- description에는 행사 설명만 작성하고, 프로모션 코드는 포함하지 마세요

## 주의사항
- 검색 결과에 기반한 정보만 사용 (추측 금지)
- 날짜/시간은 KST 기준
- 프로모션 만료일이 현재 시각 이전이면 포함하지 마세요
"""


def get_promotions():
    client = genai.Client(
        api_key=os.environ.get("GEMINI_API_KEY"),
    )

    existing_data = load_existing_promotions()
    current_time = get_current_time_kst()
    prompt = build_prompt(existing_data, current_time)

    print("=" * 50)
    print("프롬프트:")
    print("=" * 50)
    print(prompt)
    print("=" * 50)

    model = "gemini-3-flash-preview"
    contents = [
        types.Content(
            role="user",
            parts=[
                types.Part.from_text(text=prompt),
            ],
        ),
    ]
    tools = [
        types.Tool(google_search=types.GoogleSearch()),
    ]
    generate_content_config = types.GenerateContentConfig(
        response_mime_type="application/json",
        response_schema=Promotions.model_json_schema(),
        tools=tools,
    )

    response = client.models.generate_content(
        model=model,
        contents=contents,
        config=generate_content_config,
    )

    print("\n" + "=" * 50)
    print("응답:")
    print("=" * 50)
    print(response.text)
    print("=" * 50)

    promotions = Promotions.model_validate_json(response.text)
    return promotions


def save(data: Promotions):
    with open(DATA_PATH, "w", encoding="utf-8") as f:
        json.dump(data.model_dump(mode="json"), f, ensure_ascii=False, indent=2)

    code_count = sum(
        len(code.codes)
        for promo in data.active_code_promotions
        for code in promo.codes
    )
    print(f"\n저장 완료: {DATA_PATH}")
    print(f"수집된 코드 프로모션 수: {len(data.active_code_promotions)}")
    print(f"수집된 총 코드 수: {code_count}")


if __name__ == "__main__":
    promotions = get_promotions()
    save(promotions)
