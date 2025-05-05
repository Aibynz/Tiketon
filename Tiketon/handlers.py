import json
import asyncio
import asyncpg
from aiogram import Router, F
from aiogram.types import (
    Message, PreCheckoutQuery, LabeledPrice,
    InlineKeyboardMarkup, InlineKeyboardButton, CallbackQuery
)
from keyboards import buy_keyboard
from config import PAYMENT_TOKEN, DATABASE_URL

router = Router()
router.payment_context = {}

# Функция для записи в PostgreSQL
async def save_booking(data: dict):
    conn = await asyncpg.connect(DATABASE_URL)
    await conn.execute('''
        INSERT INTO bookings (user_id, full_name, event, place, seats, date, time, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    ''',
        data["user_id"],
        data["full_name"],
        data["event"],
        data["place"],
        ", ".join(data["seats"]),
        data["date"],
        data["time"],
        data["status"]
    )
    await conn.close()


@router.message(F.text == "/start")
async def cmd_start(message: Message):
    await message.answer(
        "Қош келдіңіз! Билетті брондау үшін төмендегі батырманы басыңыз 👇",
        reply_markup=buy_keyboard
    )


@router.message(F.web_app_data)
async def handle_webapp_data(message: Message):
    try:
        data = json.loads(message.web_app_data.data)
        user_id = message.from_user.id

        event = data["event"]
        seats = data["seats"]
        date = data["date"]
        time = data["time"]

        router.payment_context[user_id] = {
            "event": event,
            "seats": seats,
            "date": date,
            "time": time,
            "paid": False
        }

        # Сақтау базада: Бронь (30 мин)
        await save_booking({
            "user_id": user_id,
            "full_name": message.from_user.full_name,
            "event": event["title"],
            "place": event["place"],
            "seats": seats,
            "date": date,
            "time": time,
            "status": "Бронь (30 мин)"
        })

        seat_list = ", ".join(seats)

        pay_button = InlineKeyboardMarkup(
            inline_keyboard=[
                [InlineKeyboardButton(text="💳 Оплатить бронь", callback_data="pay_bron")]
            ]
        )

        await message.answer(
            f"✅ Сіз брондадыңыз:\n\n"
            f"🎭 Іс-шара: {event['title']}\n"
            f"📍 Өтетін орны: {event['place']}\n"
            f"📅 Күні: {date} | 🕒 Уақыты: {time}\n"
            f"💺 Орындар: {seat_list}\n\n"
            f"⚠️ Бұл орындар тек 30 минутқа сақталады.",
            reply_markup=pay_button
        )

        asyncio.create_task(clear_if_unpaid(user_id, 1800))

    except Exception as e:
        await message.answer(f"❌ Қате: {e}")


async def clear_if_unpaid(user_id, delay):
    await asyncio.sleep(delay)
    context = router.payment_context.get(user_id)
    if context and not context["paid"]:
        print(f"🕒 {user_id} пайдаланушысының броні боттан өшірілді")
        del router.payment_context[user_id]


@router.callback_query(F.data == "pay_bron")
async def pay_invoice(callback: CallbackQuery):
    user_id = callback.from_user.id
    context = router.payment_context.get(user_id)

    if not context:
        await callback.message.answer("❌ Бронь табылмады немесе уақыты өтіп кетті.")
        return

    event = context["event"]
    prices = [LabeledPrice(label="Билет", amount=1000 * 100)]

    await callback.bot.send_invoice(
        chat_id=user_id,
        title="🎟 Билет",
        description=event["title"],
        payload="ticket-purchase",
        provider_token=PAYMENT_TOKEN,
        currency="KZT",
        prices=prices
    )
    await callback.answer()


@router.pre_checkout_query()
async def pre_checkout(pre_checkout_query: PreCheckoutQuery, bot):
    await bot.answer_pre_checkout_query(pre_checkout_query.id, ok=True)


@router.message(F.successful_payment)
async def success_payment(message: Message):
    user_id = message.from_user.id
    context = router.payment_context.get(user_id)

    if not context:
        await message.answer("✅ Төлем қабылданды, бірақ бронь табылмады.")
        return

    context["paid"] = True

    event = context["event"]
    seats = context["seats"]
    date = context["date"]
    time = context["time"]
    seat_list = ", ".join(seats)

    await save_booking({
        "user_id": user_id,
        "full_name": message.from_user.full_name,
        "event": event["title"],
        "place": event["place"],
        "seats": seats,
        "date": date,
        "time": time,
        "status": "Оплачено"
    })

    await message.answer(
        f"🎫 <b>Төлем сәтті өтті!</b>\n\n"
        f"🎭 <b>{event['title']}</b>\n"
        f"📍 {event['place']}\n"
        f"📅 {date} | 🕒 {time}\n"
        f"💺 Орындар: {seat_list}\n\n"
        f"Рақмет! Бронь расталды ✅",
        parse_mode="HTML"
    )