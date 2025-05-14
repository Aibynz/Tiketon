// app.js - Версия с загрузкой занятых мест и проверкой

let debugLogDiv = null;

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

logDebug("app.js: Скрипт начал выполняться [DynamicSeatsLoadingVersion_Final]");

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

// URL вашего Google Apps Script для ПОЛУЧЕНИЯ ЗАНЯТЫХ МЕСТ
const GOOGLE_SCRIPT_URL_GET_SEATS = "https://script.google.com/macros/s/AKfycbyqIxSIz5b-SjlMW3ZW4MSJTE5SRynLEruoodLvTYEhZYoq8ECpj3XiQ9_5OnjSiFhk/exec";
logDebug(`GOOGLE_SCRIPT_URL_GET_SEATS: ${GOOGLE_SCRIPT_URL_GET_SEATS}`);

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
let bookedSeats = []; // Сюда будем загружать занятые места

// DOM Элементы
let eventList, bookingSection, eventTitle, seatTable, confirmBtn, dateSelect, timeSelect, backToEventsBtn;

function initializeDOMElements() {
    logDebug("initializeDOMElements: Начало.");
    eventList = document.getElementById("eventList");
    bookingSection = document.getElementById("bookingSection");
    eventTitle = document.getElementById("eventTitle");
    seatTable = document.querySelector("#seatTable tbody");
    confirmBtn = document.getElementById("confirmBtn");
    dateSelect = document.getElementById("dateSelect");
    timeSelect = document.getElementById("timeSelect");
    backToEventsBtn = document.getElementById("backToEventsBtn");
    logDebug("initializeDOMElements: Завершено.");
}

function setupEventHandlers() {
    logDebug("setupEventHandlers: Начало.");
    if (dateSelect) {
        dateSelect.onchange = () => {
          selectedDate = dateSelect.value;
          logDebug(`dateSelect.onchange: Дата изменена на ${selectedDate}`);
          selectedSeats = []; 
          fetchAndDrawSeats(); 
          updateTelegramMainButtonState();
        };
    }

    if (timeSelect) {
        timeSelect.onchange = () => {
          selectedTime = timeSelect.value;
          logDebug(`timeSelect.onchange: Время изменено на ${selectedTime}`);
          selectedSeats = []; 
          fetchAndDrawSeats();
          updateTelegramMainButtonState();
        };
    }

    if (confirmBtn) {
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
            time: selectedTime,
            // userId извлекается на стороне бота из message.from_user.id
          };
          logDebug(`confirmBtn.onclick: Отправка данных в Telegram: ${JSON.stringify(data)}`);
          if (tg && tg.sendData) {
              try {
                  tg.sendData(JSON.stringify(data));
              } catch (e) {
                  logDebug(`ОШИБКА confirmBtn.onclick при вызове tg.sendData: ${e.message}`);
                  alert("Не удалось отправить данные. Ошибка API Telegram.");
              }
          } else {
              logDebug("ОШИБКА confirmBtn.onclick: tg.sendData не доступна!");
              alert("Не удалось отправить данные. Telegram API не доступно. (Локально данные в консоли)");
              console.log("Данные для отправки (локально):", data);
          }
        };
    }

    if (backToEventsBtn) {
        backToEventsBtn.onclick = () => {
            logDebug("backToEventsBtn.onclick: Нажата кнопка 'Назад к мероприятиям'");
            if (bookingSection) bookingSection.classList.add("fully-hidden");
            if (eventList) eventList.classList.remove("fully-hidden");
            selectedEvent = null;
            selectedSeats = [];
            bookedSeats = []; 
            if(seatTable) seatTable.innerHTML = ""; // Очищаем карту мест
            updateTelegramMainButtonState();
        };
    }
    logDebug("setupEventHandlers: Завершено.");
}

function displayEvents() {
    logDebug("displayEvents: Начало.");
    if (!eventList) { logDebug("ОШИБКА: displayEvents - eventList не инициализирован!"); return; }
    eventList.innerHTML = "";
    events.forEach(ev => {
        const card = document.createElement("div");
        card.className = "bg-white border border-gray-200 rounded-lg shadow hover:shadow-lg transition";
        card.innerHTML = `
          <div class="p-4">
            <h3 class="text-lg font-bold text-blue-800">${ev.title}</h3>
            <p class="text-sm text-gray-600">${ev.place}</p>
            <img src="${ev.image || 'https://via.placeholder.com/400x200?text=No+Image'}" alt="${ev.title}" class="w-full h-auto object-cover rounded mb-3">
            <button class="event-select-btn mt-3 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700" data-event-id="${ev.id}">
              Таңдау
            </button>
          </div>
        `;
        eventList.appendChild(card);
    });

    document.querySelectorAll('.event-select-btn').forEach(button => {
        button.addEventListener('click', function() {
            const eventId = parseInt(this.getAttribute('data-event-id'));
            logDebug(`Клик 'Таңдау' для мероприятия ID: ${eventId}`);
            selectEvent(eventId);
        });
    });
    logDebug("displayEvents: Мероприятия отображены.");
}

function selectEvent(id) {
  logDebug(`selectEvent: Выбрано мероприятие ID: ${id}`);
  selectedEvent = events.find(e => e.id === id);
  if (!selectedEvent) { logDebug(`ОШИБКА selectEvent: Мероприятие с ID ${id} не найдено!`); return; }

  selectedSeats = []; 
  bookedSeats = [];   

  if (eventTitle) eventTitle.textContent = selectedEvent.title + " | " + selectedEvent.place;
  if (eventList) eventList.classList.add("fully-hidden");
  if (bookingSection) bookingSection.classList.remove("fully-hidden");

  if (dateSelect) {
      dateSelect.innerHTML = "";
      dateList.forEach(date => {
        const option = document.createElement("option");
        option.value = date;
        option.textContent = formatDateDisplay(date);
        dateSelect.appendChild(option);
      });
      if (dateList.length > 0) {
        selectedDate = dateList[0];
        dateSelect.value = selectedDate;
      }
  }  
  if (timeSelect) {
      timeSelect.value = selectedTime; 
  }
  
  logDebug(`selectEvent: Перед fetchAndDrawSeats. Мероприятие: "${selectedEvent.title}", Дата: ${selectedDate}, Время: ${selectedTime}`);
  fetchAndDrawSeats();
  updateTelegramMainButtonState();
}

function fetchAndDrawSeats() {
    if (!selectedEvent || !selectedDate || !selectedTime) {
        logDebug("fetchAndDrawSeats: Недостаточно данных.");
        if (seatTable) seatTable.innerHTML = '<tr><td colspan="11" class="text-center p-4">Іс-шараны, күнді және уақытты таңдаңыз.</td></tr>';
        bookedSeats = [];
        drawSeatMap();
        return;
    }

    if (!seatTable) { logDebug("ОШИБКА fetchAndDrawSeats: seatTable не найден!"); return;}
    seatTable.innerHTML = '<tr><td colspan="11" class="text-center p-4">Орындар жүктелуде...</td></tr>';

    const url = `${GOOGLE_SCRIPT_URL_GET_SEATS}?title=${encodeURIComponent(selectedEvent.title)}&date=${selectedDate}&time=${selectedTime}&cachebust=${new Date().getTime()}`;
    logDebug(`WorkspaceAndDrawSeats: Запрос URL: ${url}`);

    fetch(url)
        .then(response => {
            logDebug(`WorkspaceAndDrawSeats: Ответ от Google Script, статус: ${response.status}`);
            if (!response.ok) {
                return response.text().then(text => {
                    throw new Error(`Google Script Error: ${response.status} ${response.statusText}. Details: ${text}`);
                });
            }
            return response.json();
        })
        .then(data => {
            if (data.error) {
                logDebug(`ОШИБКА от Google Script: ${data.error}. Детали: ${data.details || ''}`);
                alert(`Орындарды жүктеу мүмкін болмады: ${data.error}`);
                bookedSeats = [];
            } else {
                bookedSeats = data.booked || [];
                logDebug(`WorkspaceAndDrawSeats: Занятые места получены. Количество: ${bookedSeats.length}. Список: ${JSON.stringify(bookedSeats)}`);
            }
            drawSeatMap();
        })
        .catch(err => {
            logDebug(`КРИТИЧЕСКАЯ ОШИБКА fetchAndDrawSeats: ${err.message}.`);
            console.error("Ошибка при получении занятых мест из Google Script:", err);
            bookedSeats = []; 
            if (seatTable) seatTable.innerHTML = `<tr><td colspan="11" class="text-center p-4 text-red-500">Орындарды жүктеу кезінде қате. Консольды (F12) тексеріңіз.</td></tr>`;
        });
}

function drawSeatMap() {
  logDebug(`drawSeatMap: Начало. Занятые: ${JSON.stringify(bookedSeats)}. Выбранные: ${JSON.stringify(selectedSeats)}`);
  if (!seatTable) { logDebug("ОШИБКА drawSeatMap: seatTable не найден!"); return;}
  seatTable.innerHTML = ""; 

  if (!selectedEvent) { 
      seatTable.innerHTML = '<tr><td colspan="11" class="text-center p-4">Алдымен іс-шараны таңдаңыз.</td></tr>';
      return;
  }

  for (let row = 1; row <= 10; row++) {
    const tr = document.createElement("tr");
    const rowLabel = document.createElement("td");
    rowLabel.textContent = `${row}-қатар`;
    rowLabel.className = "p-1 font-medium bg-gray-100 text-xs md:text-sm sticky left-0 z-10";
    tr.appendChild(rowLabel);

    for (let col = 1; col <= 10; col++) {
      const seatId = `${row}-қатар ${col}-орын`;
      const td = document.createElement("td");
      td.textContent = col;

      const isAlreadyBooked = bookedSeats.includes(seatId);
      const isSelectedByUser = selectedSeats.includes(seatId);

      td.className = "p-2 border text-center text-xs md:text-sm"; 

      if (isAlreadyBooked) {
        td.classList.add("bg-red-300", "text-gray-600", "cursor-not-allowed");
        td.title = "Бұл орын бос емес";
      } else {
        td.classList.add("cursor-pointer", "hover:bg-green-300");
        if (isSelectedByUser) {
            td.classList.add("bg-green-500", "text-white");
            td.title = "Таңдалған орын";
        } else {
            td.classList.add("bg-gray-100");
            td.title = "Орынды таңдау";
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
    td.classList.remove("bg-green-500", "text-white");
    td.classList.add("bg-gray-100", "hover:bg-green-300");
    td.title = "Орынды таңдау";
  } else {
    selectedSeats.push(seatId);
    td.classList.remove("bg-gray-100");
    td.classList.add("bg-green-500", "text-white");
    td.title = "Таңдалған орын";
  }
  logDebug(`Выбрано мест: ${selectedSeats.length}. Список: ${JSON.stringify(selectedSeats)}`);
  updateTelegramMainButtonState();
}

function formatDateDisplay(dateStringISO) {
  const date = new Date(dateStringISO);
  const userTimezoneOffset = date.getTimezoneOffset() * 60000;
  const dateInLocal = new Date(date.getTime() + userTimezoneOffset);
  return dateInLocal.toLocaleDateString('kk-KZ', { year: 'numeric', month: 'long', day: 'numeric' });
}

function updateTelegramMainButtonState() {
    if (tg && tg.MainButton) {
        if (selectedEvent && selectedSeats.length > 0) {
            tg.MainButton.setParams({ is_active: true });
        } else {
            tg.MainButton.setParams({ is_active: false });
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
  debugLogDiv = document.getElementById("debugLog");
  if (debugLogDiv) { 
      logDebug("DOMContentLoaded: debugLogDiv найден.");
      // debugLogDiv.classList.add("hidden"); // Скрыть блок логов по умолчанию
  } else {
      console.log("ОШИБКА DOMContentLoaded: debugLogDiv НЕ НАЙДЕН!");
  }

  logDebug("DOMContentLoaded: DOM полностью загружен.");

  initializeDOMElements();
  setupEventHandlers(); 

  if (eventList) {
    displayEvents();
  } else {
    logDebug("ОШИБКА DOMContentLoaded: eventList не найден!");
  }
  
  if (tg && tg.MainButton) {
      try {
        tg.MainButton.setParams({ text: "Таңдауды растау", color: "#2563EB", textColor: "#FFFFFF", is_visible: true, is_active: false });
        logDebug("DOMContentLoaded: Главная кнопка Telegram настроена.");
      } catch (e) {
        logDebug(`ОШИБКА DOMContentLoaded при настройке tg.MainButton: ${e.message}`);
      }
  } else {
      logDebug("ПРЕДУПРЕЖДЕНИЕ DOMContentLoaded: tg.MainButton не доступен.");
  }
  logDebug("DOMContentLoaded: Инициализация приложения завершена.");
});

logDebug("app.js: Скрипт завершил первичный код.");
