# 세일닷컴

한국 사용자를 위한 AliExpress 프로모션 코드 수집·표시 사이트의 보관용 소스입니다.

**2026년 10월 24일 자동 수집을 종료했습니다.** 저장된 데이터는 마지막 수집 당시의 기록이며, 현재 사용할 수 있는 쿠폰이나 할인 일정을 보장하지 않습니다.

## 구성

- Next.js 화면: 저장된 행사와 코드를 표시하고, 유효기간이 지난 항목은 숨깁니다.
- `scripts/collect.py`: Gemini로 후보를 찾은 뒤 출처 페이지에서 코드 원문을 확인하는 수동 수집기입니다.
- `data/promotions.json`: 마지막으로 저장된 행사 정보와 출처 링크입니다.
- 쿠폰 복사 버튼은 일반 AliExpress 홈페이지를 엽니다.

## 로컬 실행

```bash
npm ci
npm run dev
```

## 확인 및 빌드

```bash
npm run check
npm run build
```

## 수집기를 직접 실행하려면

Python 3.12 이상에서 필요한 패키지를 설치합니다.

```bash
python -m pip install -r scripts/requirements.txt
```

본인의 Gemini API 키를 `GEMINI_API_KEY` 환경변수로 설정한 뒤 실행합니다. API 키는 파일이나 Git 기록에 넣지 마세요. API 사용량에 따라 요금이 발생할 수 있습니다.

```bash
python scripts/collect.py
```

실행하면 공식·지정 전문 출처에서 코드 원문이 확인되거나, 그 밖의 독립된 출처 두 곳 이상이 일치하는 후보를 저장합니다. 수집에 실패하면 기존 데이터를 유지합니다.
