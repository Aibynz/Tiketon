// app.js - Версия на основе вашего кода, с логированием и исправлениями

const debugLogDiv = document.getElementById("debugLog");
function logDebug(message) {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 });
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    if (debugLogDiv) {
        const p = document.createElement('p');
        p.textContent = logMessage;
        debugLogDiv.appendChild(p);
        debugLogDiv.scrollTop = debugLogDiv.scrollHeight;
    }
}

logDebug("app.js: Скрипт начал выполняться [UserVersionBase]");

let tg = null;
try {
    tg = window.Telegram.WebApp;
    if (tg) {
      logDebug("Telegram WebApp API найден.");
      tg.expand();
      logDebug("tg.expand() успешно вызван.");
    } else {
      logDebug("ПРЕДУПРЕЖДЕНИЕ: Telegram WebApp API (window.Telegram.WebApp) НЕ НАЙДЕН!");
    }
} catch(e) {
    logDebug(`ОШИБКА при инициализации Telegram WebApp API: ${e.message}`);
}

const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyqIxSIz5b-SjlMW3ZW4MSJTE5SRynLEruoodLvTYEhZYoq8ECpj3XiQ9_5OnjSiFhk/exec";
logDebug(`GOOGLE_SCRIPT_URL: ${GOOGLE_SCRIPT_URL}`);

const events = [
  { id: 1, title: "«Абай» операсы", place: "С.Сейфуллин атындағы қазақ драма театры", image: "https://raw.githubusercontent.com/Aibynz/Tiketon/refs/heads/main/image1.jpg" },
  { id: 2, title: "Ерлан Көкеев концерті", place: "Орталық концерт залы", image: "https://raw.githubusercontent.com/Aibynz/Tiketon/refs/heads/main/image2.jpg" },
  { id: 3, title: "«Қыз Жібек» спектаклі", place: "Жастар театры", image: "https://raw.githubusercontent.com/Aibynz/Tiketon/refs/heads/main/image3.jpg" }
];
logDebug(`Массив events определен, количество: ${events.length}`);

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
logDebug(`Массив dateList сгенерирован, количество: ${dateList.length}`);

let selectedEvent = null;
let selectedSeats = [];
let selectedDate = "";
let selectedTime = "16:00";
let bookedSeats = [];

// DOM Элементы - будем инициализировать в DOMContentLoaded
let eventList, bookingSection, eventTitle, seatTable, confirmBtn, dateSelect, timeSelect, backToEventsBtn;

function initializeDOMElements() {
    logDebug("initializeDOMElements: Начало инициализации DOM элементов.");
    eventList = document.getElementById("eventList");
    bookingSection = document.getElementById("bookingSection");
    eventTitle = document.getElementById("eventTitle");
    seatTable = document.querySelector("#seatTable tbody");
    confirmBtn = document.getElementById("confirmBtn");
    dateSelect = document.getElementById("dateSelect");
    timeSelect = document.getElementById("timeSelect");
    backToEventsBtn = document.getElementById("backToEventsBtn"); // Для кнопки "Назад"

    if (!eventList) logDebug("ОШИБКА: eventList не найден!"); else logDebug("eventList найден.");
    if (!bookingSection) logDebug("ОШИБКА: bookingSection не найден!"); else logDebug("bookingSection найден.");
    // ... и т.д. для других элементов
    logDebug("initializeDOMElements: Завершение инициализации DOM элементов.");
}

function displayEvents() {
    logDebug("displayEvents: Начало отображения мероприятий.");
    if (!eventList) {
        logDebug("ОШИБКА: displayEvents - eventList не инициализирован!");
        return;
    }
    eventList.innerHTML = ""; // Очистка перед добавлением
    events.forEach(ev => {
        const card = document.createElement("div");
        card.className = "bg-white border border-gray-200 rounded-lg shadow hover:shadow-lg transition";
        card.innerHTML = `
          <div class="p-4">
            <h3 class="text-lg font-bold text-blue-800">${ev.title}</h3>
            <p class="text-sm text-gray-600">${ev.place}</p>
            <img src="${ev.image || 'https://via.placeholder.com/150'}" alt="${ev.title}" class="w-full h-auto object-cover rounded mb-3">
            <button class="event-select-btn mt-3 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700" data-event-id="${ev.id}">
              Таңдау
            </button>
          </div>
        `;
        eventList.appendChild(card);
    });

    // Привязываем обработчики после добавления элементов в DOM
    document.querySelectorAll('.event-select-btn').forEach(button => {
        button.addEventListener('click', function() {
            const eventId = parseInt(this.getAttribute('data-event-id'));
            logDebug(`Клик на кнопке 'Таңдау' для мероприятия ID: ${eventId}`);
            selectEvent(eventId);
        });
    });
    logDebug(`displayEvents: Мероприятия (${eventList.children.length} шт.) отображены. HTML eventList (начало): ${eventList.innerHTML.substring(0,100)}...`);
}

function selectEvent(id) {
  logDebug(`selectEvent: Выбрано мероприятие ID: ${id}`);
  selectedEvent = events.find(e => e.id === id);
  if (!selectedEvent) {
      logDebug(`ОШИБКА selectEvent: Мероприятие с ID ${id} не найдено!`);
      return;
  }
  selectedSeats = [];
  bookedSeats = [];

  if (eventTitle) eventTitle.textContent = selectedEvent.title + " | " + selectedEvent.place;
  else logDebug("ОШИБКА selectEvent: eventTitle не найден!");

  if (eventList) eventList.classList.add("fully-hidden"); // Скрываем список мероприятий
  else logDebug("ОШИБКА selectEvent: eventList не найден для скрытия!");
  if (bookingSection) bookingSection.classList.remove("fully-hidden"); // Показываем секцию бронирования
  else logDebug("ОШИБКА selectEvent: bookingSection не найден для отображения!");


  if (dateSelect) {
      dateSelect.innerHTML = "";
      dateList.forEach(date => {
        const option = document.createElement("option");
        option.value = date;
        // Для отображения можно форматировать, но ваш код просто выводил date
        option.textContent = date; // formatDateDisplay(date); 
        dateSelect.appendChild(option);
      });
      if (dateList.length > 0) {
        selectedDate = dateList[0];
        dateSelect.value = selectedDate;
      }
  } else { logDebug("ОШИБКА selectEvent: dateSelect не найден!"); }
  
  if (timeSelect) timeSelect.value = selectedTime; // Устанавливаем время по умолчанию

  logDebug(`selectEvent: Перед fetchBookedSeats. Дата: ${selectedDate}, Время: ${selectedTime}`);
  fetchBookedSeats();
}

if (typeof dateSelect !== 'undefined' && dateSelect) { // Проверяем, что переменная определена, а не только элемент
    dateSelect.onchange = () => {
      selectedDate = dateSelect.value;
      logDebug(`dateSelect.onchange: Дата изменена на ${selectedDate}`);
      fetchBookedSeats();
    };
}

if (typeof timeSelect !== 'undefined' && timeSelect) {
    timeSelect.onchange = () => {
      selectedTime = timeSelect.value;
      logDebug(`timeSelect.onchange: Время изменено на ${selectedTime}`);
      fetchBookedSeats();
    };
}

function fetchBookedSeats() {
  logDebug(`WorkspaceBookedSeats: Начало. Мероприятие: ${selectedEvent ? selectedEvent.title : 'null'}, Дата: ${selectedDate}, Время: ${selectedTime}`);
  if (!selectedEvent || !selectedDate || !selectedTime) {
      logDebug("fetchBookedSeats: Недостаточно данных для запроса.");
      if (seatTable) seatTable.innerHTML = '<tr><td colspan="11" class="text-center p-4">Іс-шара, күн және уақытты таңдаңыз.</td></tr>';
      return;
  }
  if (!seatTable) { logDebug("ОШИБКА fetchBookedSeats: seatTable не найден!"); return;}

  seatTable.innerHTML = '<tr><td colspan="11" class="text-center p-4">Орындар жүктелуде...</td></tr>';
  const url = `${GOOGLE_SCRIPT_URL}?title=${encodeURIComponent(selectedEvent.title)}&date=${selectedDate}&time=${selectedTime}&cachebust=${new Date().getTime()}`;
  logDebug(`WorkspaceBookedSeats: Запрос URL: ${url}`);

  fetch(url)
    .then(response => {
        logDebug(`WorkspaceBookedSeats: Получен ответ от сервера, статус: ${response.status}`);
        if (!response.ok) {
            throw new Error(`Сетевая ошибка: ${response.status} ${response.statusText}`);
        }
        return response.json();
    })
    .then(data => {
      logDebug(`WorkspaceBookedSeats: Данные от сервера (JSON): ${JSON.stringify(data)}`);
      bookedSeats = data.booked || [];
      drawSeatMap();
    })
    .catch(err => {
      logDebug(`ОШИБКА fetchBookedSeats: ${err.message}. URL: ${url}`);
      console.error("Ошибка при получении занятых мест:", err);
      bookedSeats = [];
      if (seatTable) seatTable.innerHTML = `<tr><td colspan="11" class="text-center p-4 text-red-500">Орындарды жүктеу мүмкін болмады: ${err.message}</td></tr>`;
      drawSeatMap(); // Отрисовываем пустую карту или карту без забронированных мест
    });
}

function drawSeatMap() {
  logDebug(`drawSeatMap: Начало отрисовки. Забронированные места: ${JSON.stringify(bookedSeats)}`);
  if (!seatTable) { logDebug("ОШИБКА drawSeatMap: seatTable не найден!"); return;}
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

      if (bookedSeats.includes(seatId)) {
        td.className = "p-2 border bg-red-200 text-gray-500 text-sm cursor-not-allowed";
      } else {
        td.className = "p-2 border cursor-pointer bg-gray-100 hover:bg-green-300 text-sm";
        if (selectedSeats.includes(seatId)) { // Подсвечиваем уже выбранные при перерисовке
            td.classList.remove("bg-gray-100");
            td.classList.add("bg-green-500");
        }
        td.onclick = () => toggleSeat(td, seatId);
      }
      tr.appendChild(td);
    }
    seatTable.appendChild(tr);
  }
  logDebug("drawSeatMap: Карта мест отрисована.");
}

function toggleSeat(td, seatId) {
  logDebug(`toggleSeat: Клик по месту ${seatId}`);
  const index = selectedSeats.indexOf(seatId);
  if (index > -1) {
    selectedSeats.splice(index, 1);
    td.classList.remove("bg-green-500");
    td.classList.add("bg-gray-100"); // Возвращаем стиль доступного
    logDebug(`Место ${seatId} отменено. Выбрано: ${selectedSeats.length}`);
  } else {
    selectedSeats.push(seatId);
    td.classList.remove("bg-gray-100");
    td.classList.add("bg-green-500"); // Стиль выбранного
    logDebug(`Место ${seatId} выбрано. Выбрано: ${selectedSeats.length}`);
  }
}

if (typeof confirmBtn !== 'undefined' && confirmBtn) {
    confirmBtn.onclick = () => {
      logDebug("confirmBtn.onclick: Нажата кнопка 'Брондау'");
      if (!selectedEvent || selectedSeats.length === 0) {
        alert("Кемінде бір орынды таңдаңыз");
        return;
      }
      const data = {
        event: selectedEvent, // Отправляем весь объект selectedEvent
        seats: selectedSeats,
        date: selectedDate,
        time: selectedTime
      };
      logDebug(`confirmBtn.onclick: Отправка данных в Telegram: ${JSON.stringify(data)}`);
      if (tg && tg.sendData) {
          tg.sendData(JSON.stringify(data));
      } else {
          logDebug("ОШИБКА: tg.sendData не доступна!");
          alert("Не удалось отправить данные. Telegram API не доступно.");
      }
    };
}

// Кнопка "Назад" (если вы ее добавили в HTML)
if (typeof backToEventsBtn !== 'undefined' && backToEventsBtn) {
    backToEventsBtn.onclick = () => {
        logDebug("backToEventsBtn.onclick: Нажата кнопка 'Назад к мероприятиям'");
        if (bookingSection) bookingSection.classList.add("fully-hidden");
        if (eventList) eventList.classList.remove("fully-hidden");
        selectedEvent = null; // Сбрасываем выбранное мероприятие
    };
}


// Функция форматирования даты (если нужна для отображения в selectEvent)
// function formatDateDisplay(dateString) {
//   const date = new Date(dateString);
//   return date.toLocaleDateString('kk-KZ', { year: 'numeric', month: 'long', day: 'numeric' });
// }


// Инициализация после загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
  logDebug("DOMContentLoaded: DOM полностью загружен и готов.");
  globalDebugLogDiv = document.getElementById("debugLog"); // Инициализируем здесь
  if (globalDebugLogDiv) logDebug("DOMContentLoaded: globalDebugLogDiv найден.");
  else logDebug("ОШИБКА DOMContentLoaded: globalDebugLogDiv НЕ НАЙДЕН!");

  initializeDOMElements(); // Инициализируем ссылки на DOM элементы

  if (eventList) { // Проверяем, что eventList найден перед вызовом displayEvents
    displayEvents();   // Отображаем мероприятия
  } else {
    logDebug("ОШИБКА DOMContentLoaded: eventList не найден, displayEvents не будет вызвана!");
  }
  
  // Настройка кнопок Telegram (если API доступно)
  if (tg && tg.MainButton) {
      try {
        tg.MainButton.setParams({ text: "Таңдауды растау", color: "#2563EB", textColor: "#FFFFFF" });
        tg.MainButton.hide();
        logDebug("DOMContentLoaded: Главная кнопка Telegram настроена и скрыта.");
      } catch (e) {
        logDebug(`ОШИБКА DOMContentLoaded при настройке tg.MainButton: ${e.message}`);
      }
  } else {
      logDebug("ПРЕДУПРЕЖДЕНИЕ DOMContentLoaded: tg.MainButton не доступен.");
  }
  logDebug("DOMContentLoaded: Инициализация приложения завершена.");
});

logDebug("app.js: Скрипт завершил выполнение своего первичного (синхронного) кода.");
