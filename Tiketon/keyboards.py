from aiogram.types import WebAppInfo, InlineKeyboardMarkup, InlineKeyboardButton
from config import WEBAPP_URL

buy_keyboard = InlineKeyboardMarkup(
    inline_keyboard=[
        [
            InlineKeyboardButton(
                text="🎟 Брондау",
                web_app=WebAppInfo(url=WEBAPP_URL)
            )
        ]
    ]
)