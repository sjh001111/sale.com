import json
import os
from pathlib import Path

from dotenv import load_dotenv
from models import Promotions
from google import genai
from google.genai import types

# .env.local 파일 로드
env_path = Path(__file__).parent.parent / ".env.local"
load_dotenv(env_path)

PROMPT = """
현재 한국에서 사용 가능한 알리익스프레스(AliExpress) 프로모션 정보, 프로모션 코드,
그리고 향후 예정된 프로모션 일정을 검색해서 정리해 주세요.
날짜와 시간은 KST 기준입니다.

# 주의사항
- 검색결과에 기반하지 않은 정보는 사용하지 말아야합니다.
- 프로모션 만료일이 현재 시각 이전이라면 포함하지 말아야합니다.
"""


def get_promotions():
    client = genai.Client(
        api_key=os.environ.get("GEMINI_API_KEY"),
    )

    model = "gemini-3-flash-preview"
    contents = [
        types.Content(
            role="user",
            parts=[
                types.Part.from_text(text=PROMPT),
            ],
        ),
    ]
    tools = [
        types.Tool(googleSearch=types.GoogleSearch()),
    ]
    generate_content_config = types.GenerateContentConfig(
        # thinking_config=types.ThinkingConfig(
        #     thinking_level="HIGH",
        # ),
        response_mime_type="application/json",
        response_schema=Promotions.model_json_schema(),
        tools=tools,
    )

    response = client.models.generate_content(
        model=model,
        contents=contents,
        config=generate_content_config,
    )
    promotions = Promotions.model_validate_json(response.text)
    print(promotions)
    return promotions


def save(data: Promotions):
    script_dir = os.path.dirname(os.path.abspath(__file__))
    output_path = os.path.join(script_dir, "..", "data", "promotions.json")

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(data.model_dump(mode="json"), f, ensure_ascii=False, indent=2)

    code_count = sum(len(promo.codes) for promo in data.active_code_promotions)
    print(f"저장 완료: {output_path}")
    print(f"수집된 코드 프로모션 수: {len(data.active_code_promotions)}")
    print(f"수집된 코드 수: {code_count}")


if __name__ == "__main__":
    promotions = get_promotions()
    save(promotions)
