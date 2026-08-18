# 세일닷컴

한국에서 현재 사용할 수 있는 AliExpress 프로모션 코드를 보여주는 작은 Next.js 사이트입니다.

## 운영 방식

- `scripts/collect.py`가 Gemini 3.7 Flash로 후보를 찾고, 같은 모델의 독립된 두 번째 호출로 다시 검증합니다.
- 공식·지정 전문 출처에서 코드 원문이 확인되거나, 그 밖의 독립된 최신 출처 두 곳 이상이 일치할 때만 `data/promotions.json`에 저장합니다.
- GitHub Actions가 KST 기준 6시간마다 확인하며, 실제 내용이 바뀔 때만 커밋합니다.
- 수집에 실패하면 기존 데이터를 덮어쓰지 않고, 프런트엔드는 만료된 코드를 자동으로 숨깁니다.

GitHub 저장소의 Actions secret에는 `GEMINI_API_KEY` 하나만 필요합니다.

## 확인

```bash
npm ci
npm run check
npm run build
```
