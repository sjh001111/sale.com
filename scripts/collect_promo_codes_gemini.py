import os
import json
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv
from google import genai

# .env.local 파일 로드
env_path = Path(__file__).parent.parent / ".env.local"
load_dotenv(env_path)

PROMPT = """
알리익스프레스 한국 사이트에서 현재 사용 가능한 프로모션 코드를 찾아주세요.

검색할 내용:
- 알리익스프레스 프로모션 코드
- AliExpress Korea 쿠폰 코드
- 알리 할인 코드 2026년 1월

다음 JSON 형식으로만 응답해주세요 (다른 텍스트 없이):
{
  "codes": [
    {
      "id": "고유ID",
      "code": "프로모션코드",
      "title": "한글 제목",
      "discountAmount": "할인금액 (예: $3, 10%)",
      "minPurchase": "최소구매금액 (예: $30)",
      "validFrom": "시작일 YYYY-MM-DD",
      "validUntil": "종료일 YYYY-MM-DD",
      "category": "카테고리 (예: 신규회원, Choice, 슈퍼딜)"
    }
  ]
}

규칙:
- 확실한 코드만 포함
- 날짜를 모르면 이번 달 말일로 설정
- 최소 3개 이상의 코드 찾기
"""

# To run this code you need to install the following dependencies:
# pip install google-genai

import base64
import os
from google import genai
from google.genai import types


def generate():
    client = genai.Client(
        api_key="REMOVED", #os.environ.get("GEMINI_API_KEY"),
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
        types.Tool(googleSearch=types.GoogleSearch(
        )),
    ]
    generate_content_config = types.GenerateContentConfig(
        # thinking_config=types.ThinkingConfig(
        #     thinking_level="HIGH",
        # ),
        # tools=tools,
        response_mime_type="application/json",
    )

    for chunk in client.models.generate_content_stream(
        model=model,
        contents=contents,
        config=generate_content_config,
    ):
        print(chunk.text, end="")

if __name__ == "__main__":
    generate()


# def collect_codes():
#     print("Gemini API 호출 중...")
#
#     response = client.models.generate_content(
#         model = "gemini-3-flash-preview",
#         contents=PROMPT
#     )
#
#     # JSON 파싱
#     text = response.text.strip()
#
#     # ```json ... ``` 형식이면 추출
#     if text.startswith("```"):
#         text = text.split("```")[1]
#         if text.startswith("json"):
#             text = text[4:]
#
#     data = json.loads(text)
#
#     # 메타데이터 추가
#     result = {
#         "lastUpdated": datetime.utcnow().isoformat() + "Z",
#         "codes": data["codes"]
#     }
#
#     return result
#
# def save_codes(data):
#     script_dir = os.path.dirname(os.path.abspath(__file__))
#     output_path = os.path.join(script_dir, "..", "data", "promo-codes.json")
#
#     with open(output_path, "w", encoding="utf-8") as f:
#         json.dump(data, f, ensure_ascii=False, indent=2)
#
#     print(f"저장 완료: {output_path}")
#     print(f"수집된 코드 수: {len(data['codes'])}")
#
# if __name__ == "__main__":
#     try:
#         codes = collect_codes()
#         print(codes)
#         # save_codes(codes)
#         print("성공!")
#     except Exception as e:
#         print(f"에러: {e}")
#         exit(1)
