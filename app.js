let tg = window.Telegram.WebApp;
tg.expand();

const events = [
  { id: 1, title: "Концерт симфонического оркестра", place: "ГАТОБ", date: "2025-05-12" },
  { id: 2, title: "Театр: Евгений Онегин", place: "Драматический театр", date: "2025-05-15" },
  { id: 3, title: "Jazz Night", place: "Philharmonia", date: "2025-05-20" }
];

let selectedEvent = null;
let selectedSeats = [];

const eventList = document.getElementById("eventList");
const bookingSection = document.getElementById("bookingSection");
const eventTitle = document.getElementById("eventTitle");
const seatGrid = document.getElementById("seats");
const confirmBtn = document.getElementById("confirmBtn");

events.forEach(ev => {
  const card = document.createElement("div");
  card.className = "bg-white p-4 shadow rounded hover:bg-blue-50 cursor-pointer";
  card.innerHTML = `
    <h3 class="text-lg font-semibold">${ev.title}</h3>
    <p class="text-sm text-gray-600">${ev.place} — ${ev.date}</p>
  `;
  card.onclick = () => selectEvent(ev);
  eventList.appendChild(card);
});

function selectEvent(ev) {
  selectedEvent = ev;
  selectedSeats = [];
  eventTitle.textContent = ev.title + " — " + ev.date;
  seatGrid.innerHTML = "";
  bookingSection.classList.remove("hidden");

  for (let i = 1; i <= 25; i++) {
    const btn = document.createElement("button");
    btn.className = "bg-gray-200 hover:bg-green-400 p-2 rounded";
    btn.textContent = `Место ${i}`;
    btn.dataset.seat = i;
    btn.onclick = () => toggleSeat(btn, i);
    seatGrid.appendChild(btn);
  }
}

function toggleSeat(button, seat) {
  const index = selectedSeats.indexOf(seat);
  if (index > -1) {
    selectedSeats.splice(index, 1);
    button.classList.remove("bg-green-500");
    button.classList.add("bg-gray-200");
  } else {
    selectedSeats.push(seat);
    button.classList.remove("bg-gray-200");
    button.classList.add("bg-green-500");
  }
}

confirmBtn.onclick = () => {
  if (!selectedEvent || selectedSeats.length === 0) {
    alert("Выберите хотя бы одно место");
    return;
  }

  const data = {
    event: selectedEvent,
    seats: selectedSeats
  };

  tg.sendData(JSON.stringify(data));
  tg.close();
};
