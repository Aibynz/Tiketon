document.addEventListener("DOMContentLoaded", () => {
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

  seatTable.addEventListener("click", (e) => {
    if (e.target.tagName === "BUTTON") {
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

    console.log("Жіберіліп жатыр:", data);

    try {
      tg.sendData(JSON.stringify(data));
    } catch (e) {
      alert("❌ Қате жібергенде: " + e);
    }
  });
});
