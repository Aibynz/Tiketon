document.addEventListener("DOMContentLoaded", async () => {
  const tg = window.Telegram.WebApp;
  tg.expand();

  const dateSelect = document.getElementById("dateSelect");
  const timeSelect = document.getElementById("timeSelect");
  const confirmBtn = document.getElementById("confirmBtn");
  const seatTable = document.getElementById("seatTable");

  let selectedEvent = {
    title: document.getElementById("eventTitle")?.innerText || "Бос атау",
    place: "Қарағанды Театры"
  };

  let selectedSeats = [];

  // ✅ Жүктелген кезде — базаға сұраныс
  async function fetchBookedSeats() {
    try {
      const res = await fetch("http://localhost:8000/booked-seats"); // 🔁 production-да URL ауыстыру керек
      const data = await res.json();

      const currentDate = dateSelect.value;
      const currentTime = timeSelect.value;

      const allBookedSeats = data
        .filter(b =>
          b.event === selectedEvent.title &&
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
      console.error("🔴 fetchBookedSeats қатесі:", err);
    }
  }

  await fetchBookedSeats();

  // 🎫 орын таңдау
  seatTable.addEventListener("click", (e) => {
    if (e.target.tagName === "BUTTON" && !e.target.disabled) {
      const seat = e.target.dataset.seat;
      if (selectedSeats.includes(seat)) {
        selectedSeats = selectedSeats.filter((s) => s !== seat);
        e.target.classList.remove("selected");
      } else {
        selectedSeats.push(seat);
        e.target.classList.add("selected");
      }
    }
  });

  // 📤 sendData
  confirmBtn.addEventListener("click", () => {
    const selectedDate = dateSelect.value;
    const selectedTime = timeSelect.value;

    if (!selectedEvent.title || !selectedEvent.place || selectedSeats.length === 0) {
      alert("Барлық деректерді толтырыңыз!");
      return;
    }

    const data = {
      event: selectedEvent,
      seats: selectedSeats,
      date: selectedDate,
      time: selectedTime
    };

    console.log("➡️ Жіберіліп жатыр:", data);

    try {
      tg.sendData(JSON.stringify(data));
    } catch (e) {
      alert("❌ Қате жіберілгенде: " + e);
    }
  });
});
