document.addEventListener("DOMContentLoaded", async () => {
  const tg = window.Telegram.WebApp;
  tg.expand();

  const dateSelect = document.getElementById("dateSelect");
  const timeSelect = document.getElementById("timeSelect");
  const confirmBtn = document.getElementById("confirmBtn");
  const seatTable = document.getElementById("seatTable").querySelector("tbody");

  const poster = document.getElementById("eventPoster");
  const posterContainer = document.getElementById("posterContainer");
  const formSection = document.getElementById("formSection");

  let selectedEvent = null;
  let selectedSeats = [];

  // 🔘 Іс-шара таңдалған кезде
  document.querySelectorAll(".event-button").forEach((btn) => {
    btn.addEventListener("click", async () => {
      // Актив кластарын тазалау
      document.querySelectorAll(".event-button").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      selectedEvent = {
        title: btn.dataset.title,
        place: btn.dataset.place
      };

      // 📸 Суретті көрсету
      const imagePath = btn.dataset.img;
      poster.src = imagePath;
      posterContainer.style.display = "block";

      // 👇 Форманы көрсету
      formSection.style.display = "block";

      // ♻️ Орын таңдауды қайта бастау
      selectedSeats = [];
      seatTable.innerHTML = "";

      for (let row = 1; row <= 10; row++) {
        const tr = document.createElement("tr");
        const rowLabel = document.createElement("td");
        rowLabel.innerText = `${row}-қатар`;
        tr.appendChild(rowLabel);

        for (let col = 1; col <= 10; col++) {
          const td = document.createElement("td");
          const btn = document.createElement("button");
          btn.classList.add("seat");
          btn.dataset.seat = `${row}-қатар ${col}-орын`;
          btn.innerText = col;
          td.appendChild(btn);
          tr.appendChild(td);
        }
        seatTable.appendChild(tr);
      }

      await fetchBookedSeats(); // 🔴 брондалған орындарды белгілеу
    });
  });

  // 🔴 Брондалған орындарды алу
  async function fetchBookedSeats() {
    try {
      const res = await fetch("http://localhost:8000/booked-seats"); // немесе production URL
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
      console.error("⚠️ fetchBookedSeats қатесі:", err);
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

  // 📩 Жіберу
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

    try {
      tg.sendData(JSON.stringify(data));
    } catch (e) {
      alert("Қате: " + e.message);
    }
  });
});
