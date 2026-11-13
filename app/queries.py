from sqlalchemy import select
from sqlalchemy.orm import selectinload

from .models import OrderPart, RepairOrder, StatusHistory


def order_query():
    """Запрос заявки со всеми связями, чтобы не было N+1."""
    return (
        select(RepairOrder)
        .execution_options(populate_existing=True)
        .options(
            selectinload(RepairOrder.client),
            selectinload(RepairOrder.master),
            selectinload(RepairOrder.service),
            selectinload(RepairOrder.parts).selectinload(OrderPart.part),
            selectinload(RepairOrder.history).selectinload(StatusHistory.author),
            selectinload(RepairOrder.receipts),
        )
    )
