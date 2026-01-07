from datetime import datetime
from pydantic import BaseModel
from typing import List, Optional


class Code(BaseModel):
    """개별 프로모션 코드"""
    min_purchase: str  # 구매 조건 (예: "$20")
    discount_amount: str  # 할인액 (예: "$5")
    codes: List[str]  # 코드


class CurrentCodePromotion(BaseModel):
    """진행중인 코드 프로모션"""
    name: str  # 이름
    valid_from: datetime  # 시작일
    valid_until: datetime  # 종료일
    codes: List[Code]  # 코드 리스트


class CurrentPaymentPromotion(BaseModel):
    """진행중인 결제 프로모션"""
    payment_method: str  # 결제수단
    min_purchase: str  # 구매 조건
    discount_amount: str  # 할인액


class UpcomingPromotion(BaseModel):
    """향후 프로모션"""
    name: str  # 이름
    description: str  # 설명
    valid_from: datetime  # 시작일
    valid_until: datetime  # 종료일


class Promotions(BaseModel):
    """전체 프로모션 데이터"""
    last_updated: datetime  # 업데이트 일시
    active_code_promotions: List[CurrentCodePromotion]  # 진행중인 코드 프로모션
    active_payment_promotions: List[CurrentPaymentPromotion]  # 진행중인 결제 프로모션
    upcoming_promotions: List[UpcomingPromotion]  # 향후 프로모션