import asyncio
from aiogram import Bot, Dispatcher
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import BOT_TOKEN, DATABASE_URL
from handlers import router
import asyncpg

bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()
dp.include_router(router)

# FastAPI для WebApp
app = FastAPI()

# CORS — чтобы webapp мог делать запросы
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # можно указать точный URL фронта
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# GET /booked-seats — отдаёт все занятые места
@app.get("/booked-seats")
async def get_booked_seats():
    conn = await asyncpg.connect(DATABASE_URL)
    rows = await conn.fetch("SELECT event, date, time, seats, status FROM bookings WHERE status IN ('Оплачено', 'Бронь (30 мин)')")
    await conn.close()

    data = []
    for row in rows:
        seats = row["seats"].split(", ")
        data.append({
            "event": row["event"],
            "date": row["date"].isoformat(),
            "time": row["time"],
            "seats": seats,
            "status": row["status"]
        })
    return data

# Запуск aiogram + FastAPI
async def main():
    asyncio.create_task(dp.start_polling(bot))

if __name__ == "__main__":
    import uvicorn
    asyncio.run(main())
    uvicorn.run(app, host="0.0.0.0", port=8000)