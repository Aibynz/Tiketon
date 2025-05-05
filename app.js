document.addEventListener("DOMContentLoaded", async () => {
  const tg = window.Telegram.WebApp;
  tg.expand();

  const selectedSeats = new Set();
  const seatButtons = document.querySelectorAll(".seat");

  // 📌 Мероприятие туралы деректер (динамика керек болса, json-нан ал)
  const currentEvent = {
    title: "Абай операсы",
    place: "С.Сейфуллин театры",
    date: "2025-05-06",
    time: "16:00"
  };

  // ⬇️ 1. Орындарды базадан ал (боттың серверінен)
  async function fetchBookedSeats() {
    try {
      const response = await fetch("https://tiketon.onrender.com/api/booked", {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        }
      });
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      // ⬇️ 1.1. Боттың серверінен деректерді алу
      // ⬇️ 1.2. Деректерді JSON форматына түрлендіру
      // ⬇️ 1.3. Деректерді фильтрлеу
      // ⬇️ 1.4. Орындарды қызылмен көрсету
      // ⬇️ 1.5. Орындарды disable ету
      // ⬇️ 1.6. Орындарды таңдау
      // ⬇️ 1.7. Орындарды таңдау
      // ⬇️ 1.8. Орындарды таңдау
      // ⬇️ 1.9. Орындарды таңдау
      // ⬇️ 1.10. Орындарды таңдау
      // ⬇️ 1.11. Орындарды таңдау
      // ⬇️ 1.12. Орындарды таңдау
      // ⬇️ 1.13. Орындарды таңдау
      const data = await response.json();

      const booked = data
        .filter(
          b =>
            b.event === currentEvent.title &&
            b.date === currentEvent.date &&
            b.time === currentEvent.time
        )
        .flatMap(b => b.seats);

      // ⛔️ Қызылмен көрсет
      seatButtons.forEach(btn => {
        const seat = btn.dataset.seat;
        if (booked.includes(seat)) {
          btn.disabled = true;
          btn.classList.add("booked");
        }
      });
    } catch (err) {
      console.error("Қате орын алды:", err);
    }
  }

  await fetchBookedSeats();

  // ⬇️ 2. Кликпен орын таңдау
  seatButtons.forEach(button => {
    button.addEventListener("click", () => {
      const seat = button.dataset.seat;

      if (selectedSeats.has(seat)) {
        selectedSeats.delete(seat);
        button.classList.remove("selected");
      } else {
        selectedSeats.add(seat);
        button.classList.add("selected");
      }

      updateMainButton();
    });
  });

  // ⬇️ 3. Telegram түймесін жаңарту
  function updateMainButton() {
    if (selectedSeats.size > 0) {
      tg.MainButton.setText("✅ Брондау (" + selectedSeats.size + ")");
      tg.MainButton.show();
    } else {
      tg.MainButton.hide();
    }
  }

  // ⬇️ 4. Басты түймені басқанда дерек жіберу
  Telegram.WebApp.onEvent("mainButtonClicked", () => {
    const data = {
      event: {
        title: currentEvent.title,
        place: currentEvent.place
      },
      seats: Array.from(selectedSeats),
      date: currentEvent.date,
      time: currentEvent.time
    };

    tg.sendData(JSON.stringify(data));
  });
});