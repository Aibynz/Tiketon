let tg = window.Telegram.WebApp;
tg.expand();

const events = [
  {
    id: 1,
    title: "«Абай» операсы",
    place: "С.Сейфуллин атындағы қазақ драма театры",
    image: ""
  },
  {
    id: 2,
    title: "Ерлан Көкеев концерті",
    place: "Орталық концерт залы",
    image: ""
  },
  {
    id: 3,
    title: "«Қыз Жібек» спектаклі",
    place: "Жастар театры",
    image: ""
  }
];

const dateList = (() => {
  const now = new Date();
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(now);
    date.setDate(now.getDate() + i);
    dates.push(date.toISOString().split("T")[0]);
  }
  return dates;
})();

let selectedEvent = null;
let selectedSeats = [];
let selectedDate = "";
let selectedTime = "16:00";

const eventList = document.getElementById("eventList");
const bookingSection = document.getElementById("bookingSection");
const eventTitle = document.getElementById("eventTitle");
const seatTable = document.querySelector("#seatTable tbody");
const confirmBtn = document.getElementById("confirmBtn");
const dateSelect = document.getElementById("dateSelect");
const timeSelect = document.getElementById("timeSelect");

events.forEach(ev => {
  const card = document.createElement("div");
  card.className = "bg-white border border-gray-200 rounded-lg shadow hover:shadow-lg transition";
  card.innerHTML = `
    <div class="p-4">
      <h3 class="text-lg font-bold text-blue-800">${ev.title}</h3>
      <p class="text-sm text-gray-600">${ev.place}</p>
      <button class="mt-3 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        onclick="selectEvent(${ev.id})">
        Таңдау
      </button>
    </div>
  `;
  eventList.appendChild(card);
});

function selectEvent(id) {
  selectedEvent = events.find(e => e.id === id);
  selectedSeats = [];
  eventTitle.textContent = selectedEvent.title + " | " + selectedEvent.place;
  bookingSection.classList.remove("hidden");

  // Fill date select
  dateSelect.innerHTML = "";
  dateList.forEach(date => {
    const option = document.createElement("option");
    option.value = date;
    option.textContent = date;
    dateSelect.appendChild(option);
  });
  selectedDate = dateList[0];

  drawSeatMap();
}

dateSelect.onchange = () => selectedDate = dateSelect.value;
timeSelect.onchange = () => selectedTime = timeSelect.value;

function drawSeatMap() {
  seatTable.innerHTML = "";
  for (let row = 1; row <= 10; row++) {
    const tr = document.createElement("tr");
    const rowLabel = document.createElement("td");
    rowLabel.textContent = `${row}-қатар`;
    rowLabel.className = "p-1 font-medium bg-gray-100";
    tr.appendChild(rowLabel);

    for (let col = 1; col <= 10; col++) {
      const seatId = `${row}-қатар ${col}-орын`;
      const td = document.createElement("td");
      td.textContent = col;
      td.className = "p-2 border cursor-pointer bg-gray-100 hover:bg-green-300 text-sm";
      td.onclick = () => toggleSeat(td, seatId);
      tr.appendChild(td);
    }
    seatTable.appendChild(tr);
  }
}

function toggleSeat(td, seatId) {
  const index = selectedSeats.indexOf(seatId);
  if (index > -1) {
    selectedSeats.splice(index, 1);
    td.classList.remove("bg-green-500");
    td.classList.add("bg-gray-100");
  } else {
    selectedSeats.push(seatId);
    td.classList.remove("bg-gray-100");
    td.classList.add("bg-green-500");
  }
}

confirmBtn.onclick = () => {
  if (!selectedEvent || selectedSeats.length === 0) {
    alert("Кемінде бір орынды таңдаңыз");
    return;
  }

  const data = {
    event: selectedEvent,
    seats: selectedSeats,
    date: selectedDate,
    time: selectedTime
  };

  tg.sendData(JSON.stringify(data));
  tg.close();
};
