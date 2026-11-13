from .models import OrderPart, Receipt, RepairOrder, SparePart, StatusHistory, STATUS_LABELS, User


def user_brief(user: User | None) -> dict | None:
    if user is None:
        return None
    return {"id": user.id, "full_name": user.full_name}


def part_out(part: SparePart) -> dict:
    return {
        "id": part.id,
        "sku": part.sku,
        "name": part.name,
        "stock_qty": part.stock_qty,
        "unit_price": round(part.unit_price, 2),
        "min_threshold": part.min_threshold,
        "low_stock": part.stock_qty <= part.min_threshold,
    }


def order_part_out(item: OrderPart) -> dict:
    return {
        "id": item.id,
        "part_id": item.part_id,
        "part_name": item.part.name if item.part else "",
        "part_sku": item.part.sku if item.part else "",
        "quantity": item.quantity,
        "fixed_price": round(item.fixed_price, 2),
        "total": round(item.quantity * item.fixed_price, 2),
    }


def history_out(item: StatusHistory) -> dict:
    return {
        "id": item.id,
        "old_status": item.old_status,
        "new_status": item.new_status,
        "new_status_label": STATUS_LABELS.get(item.new_status, item.new_status),
        "comment": item.comment,
        "changed_by_name": item.author.full_name if item.author else None,
        "changed_at": item.changed_at,
    }


def receipt_out(item: Receipt) -> dict:
    return {
        "id": item.id,
        "order_id": item.order_id,
        "doc_type": item.doc_type,
        "qr_token": item.qr_token,
        "pdf_path": item.pdf_path,
        "issued_at": item.issued_at,
    }


def order_out(order: RepairOrder) -> dict:
    return {
        "id": order.id,
        "client_id": order.client_id,
        "client_name": order.client.full_name if order.client else "",
        "client_phone": order.client.phone if order.client else "",
        "master_id": order.master_id,
        "master_name": order.master.full_name if order.master else None,
        "service_id": order.service_id,
        "service_name": order.service.name if order.service else "",
        "service_category": order.service.category if order.service else "",
        "device_type": order.device_type,
        "device_model": order.device_model,
        "issue_desc": order.issue_desc,
        "photo_url": order.photo_url,
        "status": order.status,
        "status_label": STATUS_LABELS.get(order.status, order.status),
        "labor_cost": round(order.labor_cost, 2),
        "parts_cost": order.parts_cost,
        "total_cost": round(order.total_cost, 2),
        "created_at": order.created_at,
        "completed_at": order.completed_at,
        "parts": [order_part_out(p) for p in order.parts],
        "history": [history_out(h) for h in order.history],
        "receipts": [receipt_out(r) for r in order.receipts],
    }


def recalc_total(order: RepairOrder) -> None:
    order.total_cost = round(order.labor_cost + order.parts_cost, 2)
