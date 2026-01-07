from pathlib import Path

from dotenv import load_dotenv
from openai import OpenAI

env_path = Path(__file__).parent.parent / ".env.local"
load_dotenv(env_path)

client = OpenAI()

response = client.responses.create(
    model="gpt-5-nano",
    tools=[{"type": "web_search"}],
    input="현재 한국에서 사용 가능한 알리익스프레스(AliExpress) 프로모션 정보, 프로모션 코드, 그리고 향후 예정된 프로모션 일정을 찾아서 정리해 주세요.",
)

print(response.output_text)
