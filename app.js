document.addEventListener("DOMContentLoaded", async () => {
  const tg = window.Telegram.WebApp;
  tg.expand();

  const dateSelect = document.getElementById("dateSelect");
  const timeSelect = document.getElementById("timeSelect");
  const confirmBtn = document.getElementById("confirmBtn");
  const seatTable = document.getElementById("seatTable");

  let selectedEvent = null;
  let selectedSeats = [];

  // 🎭 Іс-шара таңдау
  document.querySelectorAll(".event-button").forEach((btn) => {
    btn.addEventListener("click", () => {
      selectedEvent = {
        title: btn.dataset.title,
        place: btn.dataset.place
      };

      // Таңдалған батырма көрнекі болу үшін
      document.querySelectorAll(".event-button").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });

  // 🔴 Броньдалған орындарды алу
  async function fetchBookedSeats() {
    try {
      const res = await fetch("http://localhost:8000/booked-seats"); // ⚠️ Мынау сервер адрес
      const data = await res.json();

      const currentDate = dateSelect.value;
      const currentTime = timeSelect.value;

      const allBookedSeats = data
        .filter(b =>
          b.event === selectedEvent?.title &&
          b.date === currentDate &&
          b.time === currentTime &&
          (b.status === "Оплачено" || b.status === "❌ Уақыт өтті")
        )
        .flatMap(b => b.seats);

      document.querySelectorAll(".seat").forEach(btn => {
        const seat = btn.dataset.seat;
        if (allBookedSeats.includes(seat)) {
          btn.disabled = true;
          btn.classList.add("booked");
        }
      });
    } catch (err) {
      console.error("⚠️ fetchBookedSeats error:", err);
    }
  }

  // 💺 Орын таңдауы
  seatTable.addEventListener("click", (e) => {
    if (e.target.classList.contains("seat") && !e.target.disabled) {
      const seat = e.target.dataset.seat;
      if (selectedSeats.includes(seat)) {
        selectedSeats = selectedSeats.filter(s => s !== seat);
        e.target.classList.remove("selected");
      } else {
        selectedSeats.push(seat);
        e.target.classList.add("selected");
      }
    }
  });

  // 📩 Брондау батырмасы
  confirmBtn.addEventListener("click", () => {
    const selectedDate = dateSelect.value;
    const selectedTime = timeSelect.value;

    if (!selectedEvent || selectedSeats.length === 0) {
      alert("Іс-шара мен орын таңдаңыз!");
      return;
    }

    const data = {
      event: selectedEvent,
      seats: selectedSeats,
      date: selectedDate,
      time: selectedTime
    };

    console.log("➡️ Жіберілуде:", data);
    try {
      tg.sendData(JSON.stringify(data));
    } catch (e) {
      alert("Қате: " + e.message);
    }
  });
});
