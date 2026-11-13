import html
import io
from datetime import datetime

import qrcode
import qrcode.image.svg
from sqlalchemy import select
from sqlalchemy.orm import Session

from .models import Receipt, RepairOrder, STATUS_LABELS
from .queries import order_query

DOC_LABELS = {"invoice": "Квитанция", "act": "Акт выполненных работ"}


def qr_svg(data: str) -> str:
    qr = qrcode.QRCode(box_size=4, border=2, image_factory=qrcode.image.svg.SvgPathImage)
    qr.add_data(data)
    qr.make(fit=True)
    buffer = io.BytesIO()
    qr.make_image().save(buffer)
    return buffer.getvalue().decode("utf-8")


def money(value: float) -> str:
    return f"{value:,.2f}".replace(",", " ").replace(".", ",") + " ₽"


def receipt_html(db: Session, token: str, base_url: str) -> str | None:
    receipt = db.scalar(select(Receipt).where(Receipt.qr_token == token))
    if receipt is None:
        return None
    order = db.scalar(order_query().where(RepairOrder.id == receipt.order_id))
    if order is None:
        return None

    link = f"{base_url.rstrip('/')}/r/{token}"
    rows = "".join(
        f"<tr><td>{html.escape(p.part.name)}<span class='sku'>{html.escape(p.part.sku)}</span></td>"
        f"<td class='num'>{p.quantity}</td><td class='num'>{money(p.fixed_price)}</td>"
        f"<td class='num'>{money(p.quantity * p.fixed_price)}</td></tr>"
        for p in order.parts
    )
    parts_section = (
        f"<h2>Запчасти и материалы</h2><table><thead><tr><th>Наименование</th>"
        f"<th class='num'>Кол-во</th><th class='num'>Цена</th><th class='num'>Сумма</th></tr></thead>"
        f"<tbody>{rows}</tbody></table>"
        if order.parts
        else ""
    )
    issued = receipt.issued_at.strftime("%d.%m.%Y %H:%M")
    doc_label = DOC_LABELS.get(receipt.doc_type, "Документ")
    qr = qr_svg(link)
    status = STATUS_LABELS.get(order.status, order.status)

    return f"""<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{doc_label} №{order.id:05d} — Ремонтная мастерская</title>
<style>
  * {{ box-sizing: border-box; }}
  body {{ margin: 0; padding: 32px 16px; background: #eef1f5; color: #16202c;
         font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; }}
  .sheet {{ max-width: 760px; margin: 0 auto; background: #fff; border-radius: 18px;
            padding: 40px; box-shadow: 0 18px 50px rgba(15, 30, 50, .12); }}
  .top {{ display: flex; justify-content: space-between; gap: 24px; align-items: flex-start;
          border-bottom: 2px solid #eef1f5; padding-bottom: 22px; }}
  .brand {{ display: flex; gap: 14px; align-items: center; }}
  .logo {{ width: 46px; height: 46px; border-radius: 13px; background: #ff6a2b; color: #fff;
           display: grid; place-items: center; font-weight: 800; font-size: 22px; }}
  .brand b {{ display: block; font-size: 18px; letter-spacing: -.2px; }}
  .brand span {{ color: #6b7a8c; font-size: 13px; }}
  .doc {{ text-align: right; font-size: 13px; color: #6b7a8c; }}
  .doc b {{ display: block; font-size: 17px; color: #16202c; margin-bottom: 4px; }}
  h2 {{ font-size: 13px; text-transform: uppercase; letter-spacing: .08em; color: #6b7a8c;
        margin: 28px 0 10px; }}
  .grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 10px 28px; font-size: 14px; }}
  .grid div span {{ color: #6b7a8c; display: block; font-size: 12px; margin-bottom: 2px; }}
  table {{ width: 100%; border-collapse: collapse; font-size: 14px; }}
  th, td {{ padding: 10px 8px; border-bottom: 1px solid #eef1f5; text-align: left; }}
  th {{ color: #6b7a8c; font-size: 12px; text-transform: uppercase; letter-spacing: .05em; }}
  .num {{ text-align: right; }}
  .sku {{ color: #96a3b2; font-size: 11px; margin-left: 8px; }}
  .totals {{ margin-top: 22px; margin-left: auto; width: 300px; font-size: 14px; }}
  .totals div {{ display: flex; justify-content: space-between; padding: 7px 0; }}
  .totals .grand {{ border-top: 2px solid #16202c; margin-top: 6px; padding-top: 12px;
                    font-size: 18px; font-weight: 800; }}
  .bottom {{ display: flex; justify-content: space-between; align-items: flex-end; gap: 24px;
             margin-top: 34px; padding-top: 20px; border-top: 1px dashed #d7dee7; }}
  .qr {{ text-align: center; font-size: 11px; color: #6b7a8c; }}
  .qr svg {{ width: 110px; height: 110px; display: block; margin: 0 auto 6px; }}
  .sign {{ font-size: 13px; color: #6b7a8c; line-height: 1.8; }}
  .sign b {{ color: #16202c; }}
  .status {{ display: inline-block; padding: 4px 10px; border-radius: 999px; background: #e8f7ee;
             color: #197a45; font-size: 12px; font-weight: 600; }}
  .print {{ display: block; width: fit-content; margin: 24px auto 0; padding: 12px 26px;
            border-radius: 12px; border: 0; background: #ff6a2b; color: #fff; font-size: 14px;
            font-weight: 700; cursor: pointer; }}
  @media print {{
    body {{ background: #fff; padding: 0; }}
    .sheet {{ box-shadow: none; border-radius: 0; padding: 12mm; max-width: none; }}
    .print {{ display: none; }}
  }}
  @media (max-width: 560px) {{
    .sheet {{ padding: 22px; }}
    .top {{ flex-direction: column; }}
    .doc {{ text-align: left; }}
    .grid {{ grid-template-columns: 1fr; }}
    .bottom {{ flex-direction: column; align-items: center; }}
  }}
</style>
</head>
<body>
  <div class="sheet">
    <div class="top">
      <div class="brand">
        <div class="logo">М+</div>
        <div><b>Ремонтная мастерская «Мастер+»</b><span>г. Москва, ул. Техническая, 12 · +7 (495) 120-45-67</span></div>
      </div>
      <div class="doc">
        <b>{doc_label} №{order.id:05d}</b>
        от {issued}<br>Статус: <span class="status">{html.escape(status)}</span>
      </div>
    </div>

    <h2>Клиент</h2>
    <div class="grid">
      <div><span>ФИО</span>{html.escape(order.client.full_name)}</div>
      <div><span>Телефон</span>{html.escape(order.client.phone)}</div>
    </div>

    <h2>Устройство</h2>
    <div class="grid">
      <div><span>Тип</span>{html.escape(order.device_type)}</div>
      <div><span>Модель</span>{html.escape(order.device_model)}</div>
      <div><span>Услуга</span>{html.escape(order.service.name)}</div>
      <div><span>Мастер</span>{html.escape(order.master.full_name) if order.master else "—"}</div>
    </div>

    <h2>Неисправность</h2>
    <div class="grid"><div>{html.escape(order.issue_desc)}</div></div>

    <h2>Работы</h2>
    <table>
      <thead><tr><th>Наименование</th><th class="num">Кол-во</th><th class="num">Цена</th><th class="num">Сумма</th></tr></thead>
      <tbody><tr><td>{html.escape(order.service.name)}</td><td class="num">1</td>
      <td class="num">{money(order.labor_cost)}</td><td class="num">{money(order.labor_cost)}</td></tr></tbody>
    </table>

    {parts_section}

    <div class="totals">
      <div><span>Работы</span><span>{money(order.labor_cost)}</span></div>
      <div><span>Запчасти</span><span>{money(order.parts_cost)}</span></div>
      <div class="grand"><span>Итого</span><span>{money(order.total_cost)}</span></div>
    </div>

    <div class="bottom">
      <div class="sign">
        Заявка №{order.id:05d} от {order.created_at.strftime('%d.%m.%Y')}<br>
        Мастер: <b>{html.escape(order.master.full_name) if order.master else '—'}</b><br>
        Подпись: ______________________
      </div>
      <div class="qr">
        {qr}
        Проверить документ<br><b>{token[:12]}…</b>
      </div>
    </div>
    <button class="print" onclick="window.print()">Печать / сохранить PDF</button>
  </div>
</body>
</html>"""
