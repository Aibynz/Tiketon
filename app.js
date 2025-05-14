// app.js
let tg = window.Telegram.WebApp;
tg.expand();

const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyJOoaLJEA8NykMEGmc8fJ45CuiGYeDAimSqddLUh2_GGUPod8otfrXK6t9XyffxZpmbg/exec";

const events = [
  { id: 1, title: "«Абай» операсы", place: "С.Сейфуллин атындағы қазақ драма театры", image: "https://raw.githubusercontent.com/Aibynz/Tiketon/refs/heads/main/image1.jpg" },
  { id: 2, title: "Ерлан Көкеев концерті", place: "Орталық концерт залы", image: "https://raw.githubusercontent.com/Aibynz/Tiketon/refs/heads/main/image2.jpg" },
  { id: 3, title: "«Қыз Жібек» спектаклі", place: "Жастар театры", image: "https://raw.githubusercontent.com/Aibynz/Tiketon/refs/heads/main/image3.jpg" }
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
let bookedSeats = [];

const eventListDiv = document.getElementById("eventList");
const bookingSectionDiv = document.getElementById("bookingSection");
const eventTitleH2 = document.getElementById("eventTitle");
const seatTableBody = document.querySelector("#seatTable tbody");
const confirmBtn = document.getElementById("confirmBtn"); // Эта кнопка используется в HTML
const dateSelect = document.getElementById("dateSelect");
const timeSelect = document.getElementById("timeSelect");
const selectedSeatsListSpan = document.getElementById("selectedSeatsList");
const selectedSeatsCountSpan = document.getElementById("selectedSeatsCount");
const backToEventsBtn = document.getElementById("backToEventsBtn");


function displayEvents() {
  console.log("Функция displayEvents вызвана");
  console.log("Массив events:", events);
  eventListDiv.innerHTML = "";
  if (!events || events.length === 0) {
      console.warn("Массив events пуст или не определен!");
      eventListDiv.innerHTML = "<p class='text-center text-red-500 col-span-full'>Мероприятия не найдены. Проверьте массив events в app.js</p>"; // col-span-full для grid
      return;
  }
  events.forEach(ev => {
    const card = document.createElement("div");
    card.className = "bg-white border border-gray-200 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 ease-in-out overflow-hidden";
    card.innerHTML = `
      <img src="${ev.image || 'https://via.placeholder.com/400x200?text=No+Image'}" alt="${ev.title}" class="w-full h-48 object-cover">
      <div class="p-5">
        <h3 class="text-xl font-semibold text-blue-700 mb-1">${ev.title}</h3>
        <p class="text-sm text-gray-600 mb-3">${ev.place}</p>
        <button class="w-full bg-blue-600 text-white py-2.5 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors"
                onclick="handleEventSelection(${ev.id})">
          Орындарды таңдау
        </button>
      </div>
    `;
    eventListDiv.appendChild(card);
  });
  console.log("Карточки мероприятий должны были быть добавлены в DOM.");
}

function handleEventSelection(eventId) {
  console.log(`Выбрано мероприятие с ID: ${eventId}`);
  selectedEvent = events.find(e => e.id === eventId);
  if (!selectedEvent) {
    console.error(`Мероприятие с ID ${eventId} не найдено в массиве events.`);
    return;
  }
  console.log("Выбранное мероприятие:", selectedEvent);

  selectedSeats = [];
  bookedSeats = [];

  eventTitleH2.textContent = `${selectedEvent.title} | ${selectedEvent.place}`;
  
  dateSelect.innerHTML = "";
  dateList.forEach(dateStr => {
    const option = document.createElement("option");
    option.value = dateStr;
    option.textContent = formatDateDisplay(dateStr);
    dateSelect.appendChild(option);
  });
  selectedDate = dateList[0];
  dateSelect.value = selectedDate;
  timeSelect.value = selectedTime; // Устанавливаем значение по умолчанию

  eventListDiv.classList.add("hidden");
  bookingSectionDiv.classList.remove("hidden");
  
  if (tg.MainButton) {
    tg.MainButton.setText(`Брондау (${selectedSeats.length} орын)`);
    tg.MainButton.show();
    tg.MainButton.onClick(handleConfirmBookingViaTelegram); // Переименовал для ясности
  } else {
    console.warn("Telegram MainButton не доступен. tg.MainButton is undefined");
  }


  fetchBookedSeatsAndUpdateMap();
  updateSelectedSeatsDisplay();
}

backToEventsBtn.onclick = () => {
  bookingSectionDiv.classList.add("hidden");
  eventListDiv.classList.remove("hidden");
  if (tg.MainButton) {
    tg.MainButton.hide();
  }
  selectedEvent = null;
  console.log("Возврат к списку мероприятий.");
};

dateSelect.onchange = () => {
  selectedDate = dateSelect.value;
  console.log(`Дата изменена на: ${selectedDate}`);
  selectedSeats = [];
  fetchBookedSeatsAndUpdateMap();
  updateSelectedSeatsDisplay();
};
timeSelect.onchange = () => {
  selectedTime = timeSelect.value;
  console.log(`Время изменено на: ${selectedTime}`);
  selectedSeats = [];
  fetchBookedSeatsAndUpdateMap();
  updateSelectedSeatsDisplay();
};

function fetchBookedSeatsAndUpdateMap() {
  if (!selectedEvent || !selectedDate || !selectedTime) {
    console.warn("fetchBookedSeats: Недостаточно данных (событие/дата/время не выбраны).", {selectedEvent, selectedDate, selectedTime});
    seatTableBody.innerHTML = '<tr><td colspan="11" class="p-4 text-center text-gray-500">Іс-шара, күн және уақытты таңдаңыз.</td></tr>';
    return;
  }

  seatTableBody.innerHTML = '<tr><td colspan="11" class="p-4 text-center text-gray-500">Орындар жүктелуде...</td></tr>';
  const url = `${GOOGLE_SCRIPT_URL}?title=${encodeURIComponent(selectedEvent.title)}&date=${selectedDate}&time=${selectedTime}&cachebust=${new Date().getTime()}`;
  console.log("Запрос забронированных мест по URL:", url);

  fetch(url)
    .then(async response => { // Делаем response доступным для логирования
        const responseText = await response.text(); // Читаем тело ответа как текст
        console.log(`Ответ от Google Script (статус ${response.status}):`, responseText);
        if (!response.ok) {
            throw new Error(`Network response was not ok: ${response.status} ${response.statusText}. Body: ${responseText}`);
        }
        try {
            return JSON.parse(responseText); // Пытаемся парсить текст как JSON
        } catch (e) {
            console.error("Ошибка парсинга JSON от Google Script:", e, "Тело ответа:", responseText);
            throw new Error("Не удалось разобрать ответ от сервера как JSON.");
        }
    })
    .then(data => {
      console.log("Разобранные данные от Google Script:", data);
      if (data && Array.isArray(data.booked)) {
        bookedSeats = data.booked;
      } else {
        console.warn("Ответ от Google Script не содержит ожидаемый массив 'booked'. Используется пустой массив. Получено:", data);
        bookedSeats = [];
      }
      console.log("Обновленный массив bookedSeats:", bookedSeats);
      drawSeatMap();
    })
    .catch(err => {
      console.error("Ошибка при получении или обработке занятых мест из Google Script:", err);
      bookedSeats = [];
      seatTableBody.innerHTML = `<tr><td colspan="11" class="p-4 text-center text-red-500">Орындарды жүктеу мүмкін болмады: ${err.message}. Қосымша ақпаратты консольдан қараңыз.</td></tr>`;
    });
}

function drawSeatMap() {
  console.log("drawSeatMap вызвана. Забронированные места:", bookedSeats);
  seatTableBody.innerHTML = "";
  const numRows = 10;
  const numCols = 10;

  for (let row = 1; row <= numRows; row++) {
    const tr = document.createElement("tr");
    const rowLabelTd = document.createElement("td");
    rowLabelTd.textContent = `${row}`;
    rowLabelTd.className = "p-1 md:p-2 font-medium bg-gray-100 text-xs md:text-sm text-gray-700 sticky left-0 z-10";
    tr.appendChild(rowLabelTd);

    for (let col = 1; col <= numCols; col++) {
      const seatId = `${row}-қатар ${col}-орын`;
      const seatCell = document.createElement("td");
      seatCell.textContent = col;
      
      let cellClasses = "p-1.5 md:p-2 border border-gray-300 text-xs md:text-sm text-center ";
      // console.log(`Проверка места: ${seatId}. Есть в bookedSeats (${bookedSeats.length} шт.)?`, bookedSeats.includes(seatId)); // Детальное логгирование каждого места

      if (bookedSeats.includes(seatId)) {
        cellClasses += "seat-booked";
      } else {
        cellClasses += "seat-available cursor-pointer"; // hover:bg-green-200 - удалил, т.к. есть в <style>
        if (selectedSeats.includes(seatId)) {
          cellClasses += " seat-selected";
        }
        seatCell.onclick = () => handleSeatSelection(seatCell, seatId);
      }
      seatCell.className = cellClasses;
      tr.appendChild(seatCell);
    }
    seatTableBody.appendChild(tr);
  }
  console.log("Карта мест отрисована.");
}

function handleSeatSelection(seatCell, seatId) {
  const index = selectedSeats.indexOf(seatId);
  if (index > -1) {
    selectedSeats.splice(index, 1);
    seatCell.classList.remove("seat-selected");
    console.log(`Место ${seatId} отменено.`);
  } else {
    selectedSeats.push(seatId);
    seatCell.classList.add("seat-selected");
    console.log(`Место ${seatId} выбрано.`);
  }
  updateSelectedSeatsDisplay();
}

function updateSelectedSeatsDisplay() {
  selectedSeatsCountSpan.textContent = selectedSeats.length;
  if (tg.MainButton) {
    tg.MainButton.setText(`Брондау (${selectedSeats.length} орын)`);
  }

  if (selectedSeats.length === 0) {
    selectedSeatsListSpan.textContent = "Ешқандай орын таңдалмады";
    if (tg.MainButton) tg.MainButton.disable();
    confirmBtn.disabled = true; // Также для HTML кнопки
  } else {
    selectedSeatsListSpan.textContent = selectedSeats.join(", ");
    if (tg.MainButton) tg.MainButton.enable();
    confirmBtn.disabled = false; // Также для HTML кнопки
  }
  console.log("Обновлено отображение выбранных мест:", selectedSeats);
}

// Для HTML кнопки
confirmBtn.onclick = () => {
    console.log("Нажата HTML кнопка 'Брондау'");
    handleConfirmBookingViaTelegram(); // Вызываем ту же функцию, что и для Telegram кнопки
};

// Общая функция для отправки данных, используется и HTML кнопкой, и Telegram кнопкой
function handleConfirmBookingViaTelegram() {
  console.log("handleConfirmBookingViaTelegram вызвана. Выбранные места:", selectedSeats);
  if (!selectedEvent || selectedSeats.length === 0) {
    const alertMsg = "Кемінде бір орынды таңдаңыз / Пожалуйста, выберите хотя бы одно место.";
    console.warn(alertMsg);
    if (tg.showAlert) {
        tg.showAlert(alertMsg);
    } else {
        alert(alertMsg);
    }
    return;
  }

  const dataToSend = {
    event: { id: selectedEvent.id, title: selectedEvent.title, place: selectedEvent.place },
    seats: selectedSeats,
    date: selectedDate,
    time: selectedTime
  };
  console.log("Отправка данных в Telegram:", dataToSend);
  tg.sendData(JSON.stringify(dataToSend));
}

function formatDateDisplay(dateString) {
  const date = new Date(dateString);
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString('kk-KZ', options);
}

document.addEventListener('DOMContentLoaded', () => {
  console.log("DOM полностью загружен и разобран. Инициализация приложения...");
  displayEvents();
  
  if (tg.MainButton) {
      tg.MainButton.setParams({ text: "Таңдауды растау", color: "#2563EB", textColor: "#FFFFFF" });
      tg.MainButton.hide();
      console.log("Главная кнопка Telegram настроена и скрыта.");
  } else {
      console.warn("Telegram WebApp API (tg.MainButton) не полностью доступно. Возможно, открыто не в Telegram WebApp.");
  }
  updateSelectedSeatsDisplay(); // Инициализируем состояние кнопок
});
