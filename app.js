// app.js
console.log("app.js: Скрипт начал выполняться."); // Самый первый лог

let tg = window.Telegram.WebApp;
if (tg) {
  console.log("app.js: Telegram WebApp API найден.", tg);
  tg.expand();
  console.log("app.js: tg.expand() вызван.");
} else {
  console.error("app.js: Telegram WebApp API (window.Telegram.WebApp) НЕ НАЙДЕН!");
}

// ЗАМЕНИТЕ НА АКТУАЛЬНЫЙ URL ВАШЕГО GOOGLE APPS SCRIPT ДЛЯ ПОЛУЧЕНИЯ МЕСТ
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyqIxSIz5b-SjlMW3ZW4MSJTE5SRynLEruoodLvTYEhZYoq8ECpj3XiQ9_5OnjSiFhk/exec";

const events = [
  { id: 1, title: "«Абай» операсы", place: "С.Сейфуллин атындағы қазақ драма театры", image: "https://raw.githubusercontent.com/Aibynz/Tiketon/refs/heads/main/image1.jpg" }, // Плейсхолдер
  { id: 2, title: "Ерлан Көкеев концерті", place: "Орталық концерт залы", image: "https://raw.githubusercontent.com/Aibynz/Tiketon/refs/heads/main/image2.jpg" }, // Плейсхолдер
  { id: 3, title: "«Қыз Жібек» спектаклі", place: "Жастар театры", image: "https://raw.githubusercontent.com/Aibynz/Tiketon/refs/heads/main/image3.jpg" }      // Плейсхолдер
];
console.log("app.js: Массив events определен:", events);

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
console.log("app.js: Массив dateList определен:", dateList);

let selectedEvent = null;
let selectedSeats = [];
let selectedDate = "";
let selectedTime = "16:00";
let bookedSeats = [];

// Элементы DOM (получаем их после загрузки DOM)
let eventListDiv, bookingSectionDiv, eventTitleH2, seatTableBody, confirmBtn, dateSelect, timeSelect, selectedSeatsListSpan, selectedSeatsCountSpan, backToEventsBtn;

function initDOMElements() {
    console.log("app.js: initDOMElements() вызвана.");
    eventListDiv = document.getElementById("eventList");
    bookingSectionDiv = document.getElementById("bookingSection");
    eventTitleH2 = document.getElementById("eventTitle");
    seatTableBody = document.querySelector("#seatTable tbody");
    confirmBtn = document.getElementById("confirmBtn");
    dateSelect = document.getElementById("dateSelect");
    timeSelect = document.getElementById("timeSelect");
    selectedSeatsListSpan = document.getElementById("selectedSeatsList");
    selectedSeatsCountSpan = document.getElementById("selectedSeatsCount");
    backToEventsBtn = document.getElementById("backToEventsBtn");

    if (!eventListDiv) console.error("app.js: Элемент eventListDiv НЕ НАЙДЕН!");
    if (!confirmBtn) console.error("app.js: Элемент confirmBtn НЕ НАЙДЕН!");
    // и т.д. для других важных элементов
    console.log("app.js: initDOMElements() завершена. eventListDiv:", eventListDiv);
}


function displayEvents() {
  console.log("app.js: displayEvents() вызвана.");
  if (!eventListDiv) {
      console.error("app.js: displayEvents - eventListDiv не инициализирован! Выход.");
      return;
  }
  console.log("app.js: displayEvents - Массив events для отображения:", events);
  eventListDiv.innerHTML = ""; // Очищаем на случай повторного вызова
  
  if (!events || events.length === 0) {
      console.warn("app.js: displayEvents - Массив events пуст или не определен!");
      eventListDiv.innerHTML = "<p class='text-center text-red-500 col-span-full p-4'>Мероприятия не найдены. Проверьте массив events в app.js или ошибки в консоли.</p>";
      return;
  }

  events.forEach(ev => {
    const card = document.createElement("div");
    card.className = "bg-white border border-gray-200 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 ease-in-out overflow-hidden";
    // Используем плейсхолдеры для изображений временно
    const imageUrl = ev.image || `https://via.placeholder.com/400x200/CCCCCC/000000?text=${encodeURIComponent(ev.title)}`;
    
    card.innerHTML = `
      <img src="${imageUrl}" alt="${ev.title}" class="w-full h-48 object-cover">
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
  console.log("app.js: displayEvents - Карточки мероприятий должны были быть добавлены в DOM.");
}

function handleEventSelection(eventId) {
  console.log(`app.js: handleEventSelection - Выбрано мероприятие с ID: ${eventId}`);
  selectedEvent = events.find(e => e.id === eventId);
  if (!selectedEvent) {
    console.error(`app.js: handleEventSelection - Мероприятие с ID ${eventId} не найдено.`);
    return;
  }
  console.log("app.js: handleEventSelection - Выбранное мероприятие:", selectedEvent);

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
  timeSelect.value = selectedTime;

  eventListDiv.classList.add("hidden");
  bookingSectionDiv.classList.remove("hidden");
  
  if (tg && tg.MainButton) {
    tg.MainButton.setText(`Брондау (${selectedSeats.length} орын)`);
    tg.MainButton.show();
    tg.MainButton.onClick(handleConfirmBookingViaTelegram);
  } else {
    console.warn("app.js: handleEventSelection - tg.MainButton не доступен.");
  }

  fetchBookedSeatsAndUpdateMap();
  updateSelectedSeatsDisplay();
}

if (backToEventsBtn) { // Проверяем, что кнопка найдена
    backToEventsBtn.onclick = () => {
        console.log("app.js: Нажата кнопка 'Назад к мероприятиям'");
        if (bookingSectionDiv) bookingSectionDiv.classList.add("hidden");
        if (eventListDiv) eventListDiv.classList.remove("hidden");
        if (tg && tg.MainButton) {
            tg.MainButton.hide();
        }
        selectedEvent = null;
    };
}


if (dateSelect) {
    dateSelect.onchange = () => {
        selectedDate = dateSelect.value;
        console.log(`app.js: Дата изменена на: ${selectedDate}`);
        selectedSeats = [];
        fetchBookedSeatsAndUpdateMap();
        updateSelectedSeatsDisplay();
    };
}

if (timeSelect) {
    timeSelect.onchange = () => {
        selectedTime = timeSelect.value;
        console.log(`app.js: Время изменено на: ${selectedTime}`);
        selectedSeats = [];
        fetchBookedSeatsAndUpdateMap();
        updateSelectedSeatsDisplay();
    };
}


function fetchBookedSeatsAndUpdateMap() {
  if (!selectedEvent || !selectedDate || !selectedTime) {
    console.warn("app.js: fetchBookedSeats - Недостаточно данных.", {selectedEvent, selectedDate, selectedTime});
    if (seatTableBody) seatTableBody.innerHTML = '<tr><td colspan="11" class="p-4 text-center text-gray-500">Іс-шара, күн және уақытты таңдаңыз.</td></tr>';
    return;
  }
  if (!seatTableBody) {
      console.error("app.js: fetchBookedSeats - seatTableBody не найден!");
      return;
  }

  seatTableBody.innerHTML = '<tr><td colspan="11" class="p-4 text-center text-gray-500">Орындар жүктелуде...</td></tr>';
  
  const url = `${GOOGLE_SCRIPT_URL}?title=${encodeURIComponent(selectedEvent.title)}&date=${selectedDate}&time=${selectedTime}&cachebust=${new Date().getTime()}`;
  console.log("app.js: fetchBookedSeats - Запрос URL (к Google Script):", url);

  fetch(url)
    .then(async response => {
        const responseText = await response.text();
        console.log(`app.js: fetchBookedSeats - Ответ от Google Script (статус ${response.status}):`, responseText);
        if (!response.ok) {
            let errorDetail = `Код ответа: ${response.status} ${response.statusText}.`;
            try {
                const parsedError = JSON.parse(responseText);
                if(parsedError && parsedError.error) errorDetail += ` Сообщение сервера: ${parsedError.error}`;
            } catch(e) { /* не JSON */ }
            throw new Error(`Сетевая ошибка при запросе к Google Script. ${errorDetail}`);
        }
        try {
            return JSON.parse(responseText);
        } catch (e) {
            console.error("app.js: fetchBookedSeats - Ошибка парсинга JSON от Google Script:", e, "Тело ответа:", responseText);
            throw new Error("Не удалось разобрать ответ от сервера (Google Script) как JSON.");
        }
    })
    .then(data => {
      console.log("app.js: fetchBookedSeats - Разобранные данные от Google Script:", data);
      if (data && Array.isArray(data.booked)) {
        bookedSeats = data.booked;
      } else if (data && data.error) {
        console.error("app.js: fetchBookedSeats - Ошибка от Google Script в ответе:", data.error);
        bookedSeats = [];
        if(seatTableBody) seatTableBody.innerHTML = `<tr><td colspan="11" class="p-4 text-center text-red-500">Қателік: ${data.error}</td></tr>`;
        return; 
      } else {
        console.warn("app.js: fetchBookedSeats - Ответ от Google Script не содержит 'booked'.", data);
        bookedSeats = [];
      }
      drawSeatMap();
    })
    .catch(err => {
      console.error("app.js: fetchBookedSeats - Общая ошибка fetch:", err);
      bookedSeats = [];
      if(seatTableBody) seatTableBody.innerHTML = `<tr><td colspan="11" class="p-4 text-center text-red-500">Орындарды жүктеу мүмкін болмады: ${err.message}. Консольды тексеріңіз.</td></tr>`;
    });
}

function drawSeatMap() {
  console.log("app.js: drawSeatMap вызвана. Забронированные места:", bookedSeats);
  if (!seatTableBody) {
      console.error("app.js: drawSeatMap - seatTableBody не найден!");
      return;
  }
  seatTableBody.innerHTML = "";
  const numRows = 10, numCols = 10;

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
      if (bookedSeats.includes(seatId)) {
        cellClasses += "seat-booked";
      } else {
        cellClasses += "seat-available cursor-pointer";
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
  console.log("app.js: drawSeatMap - Карта мест отрисована.");
}

function handleSeatSelection(seatCell, seatId) {
  const index = selectedSeats.indexOf(seatId);
  if (index > -1) {
    selectedSeats.splice(index, 1);
    seatCell.classList.remove("seat-selected");
  } else {
    selectedSeats.push(seatId);
    seatCell.classList.add("seat-selected");
  }
  updateSelectedSeatsDisplay();
}

function updateSelectedSeatsDisplay() {
  if (!selectedSeatsCountSpan || !selectedSeatsListSpan || !confirmBtn) {
      console.warn("app.js: updateSelectedSeatsDisplay - один из элементов интерфейса не найден.");
      return;
  }
  selectedSeatsCountSpan.textContent = selectedSeats.length;
  if (tg && tg.MainButton) {
    tg.MainButton.setText(`Брондау (${selectedSeats.length} орын)`);
  }

  if (selectedSeats.length === 0) {
    selectedSeatsListSpan.textContent = "Ешқандай орын таңдалмады";
    if (tg && tg.MainButton) tg.MainButton.disable();
    confirmBtn.disabled = true;
  } else {
    selectedSeatsListSpan.textContent = selectedSeats.join(", ");
    if (tg && tg.MainButton) tg.MainButton.enable();
    confirmBtn.disabled = false;
  }
}

if (confirmBtn) {
    confirmBtn.onclick = () => {
        console.log("app.js: Нажата HTML кнопка 'Брондау'");
        handleConfirmBookingViaTelegram();
    };
}

function handleConfirmBookingViaTelegram() {
  console.log("app.js: handleConfirmBookingViaTelegram. Выбранные места:", selectedSeats);
  if (!selectedEvent || selectedSeats.length === 0) {
    const alertMsg = "Кемінде бір орынды таңдаңыз.";
    if (tg && tg.showAlert) { tg.showAlert(alertMsg); } else { alert(alertMsg); }
    return;
  }
  const dataToSend = {
    event: { id: selectedEvent.id, title: selectedEvent.title, place: selectedEvent.place },
    seats: selectedSeats, date: selectedDate, time: selectedTime
  };
  console.log("app.js: Отправка данных в Telegram:", dataToSend);
  if (tg && tg.sendData) {
      tg.sendData(JSON.stringify(dataToSend));
  } else {
      console.error("app.js: tg.sendData не доступна для отправки данных!");
  }
}

function formatDateDisplay(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('kk-KZ', { year: 'numeric', month: 'long', day: 'numeric' });
}

// Инициализация после загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
  console.log("app.js: DOMContentLoaded - DOM полностью загружен и разобран.");
  initDOMElements(); // Инициализируем ссылки на DOM элементы
  displayEvents();   // Отображаем мероприятия
  
  if (tg && tg.MainButton) {
      tg.MainButton.setParams({ text: "Таңдауды растау", color: "#2563EB", textColor: "#FFFFFF" });
      tg.MainButton.hide();
      console.log("app.js: DOMContentLoaded - Главная кнопка Telegram настроена и скрыта.");
  } else {
      console.warn("app.js: DOMContentLoaded - tg.MainButton не доступен.");
  }
  // Начальное состояние кнопки подтверждения
  if (confirmBtn) { // Проверяем наличие кнопки
      updateSelectedSeatsDisplay(); 
  }
  console.log("app.js: DOMContentLoaded - Инициализация приложения завершена.");
});

console.log("app.js: Скрипт завершил выполнение первичного кода (до DOMContentLoaded).");
