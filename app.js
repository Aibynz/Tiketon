// app.js - Версия с локальной отрисовкой мест

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

logDebug("app.js: Скрипт начал выполняться [LocalSeatsVersion]");

let tg = null;
try {
    tg = window.Telegram.WebApp;
    if (tg) {
      logDebug("Telegram WebApp API найден.");
      tg.expand();
      logDebug("tg.expand() успешно вызван.");
    } else {
      logDebug("ПРЕДУПРЕЖДЕНИЕ: Telegram WebApp API (window.Telegram.WebApp) НЕ НАЙДЕН!");
      // Для локальной разработки без Telegram, можно добавить заглушку tg, как обсуждалось ранее.
    }
} catch(e) {
    logDebug(`ОШИБКА при инициализации Telegram WebApp API: ${e.message}`);
}

// GOOGLE_SCRIPT_URL нам больше не нужен для получения мест, но может понадобиться для других целей в будущем.
// const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyqIxSIz5b-SjlMW3ZW4MSJTE5SRynLEruoodLvTYEhZYoq8ECpj3XiQ9_5OnjSiFhk/exec";
// logDebug(`GOOGLE_SCRIPT_URL: ${GOOGLE_SCRIPT_URL}`); // Закомментировано

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
let selectedSeats = []; // Выбранные пользователем места
let selectedDate = "";
let selectedTime = "16:00";
// let bookedSeats = []; // Эту переменную мы больше не будем заполнять извне для отрисовки

// DOM Элементы
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
    backToEventsBtn = document.getElementById("backToEventsBtn");

    if (!eventList) logDebug("ОШИБКА: eventList не найден!"); else logDebug("eventList найден.");
    if (!bookingSection) logDebug("ОШИБКА: bookingSection не найден!"); else logDebug("bookingSection найден.");
    if (!eventTitle) logDebug("ОШИБКА: eventTitle не найден!"); else logDebug("eventTitle найден.");
    if (!seatTable) logDebug("ОШИБКА: seatTable tbody не найден!"); else logDebug("seatTable tbody найден.");
    if (!confirmBtn) logDebug("ОШИБКА: confirmBtn не найден!"); else logDebug("confirmBtn найден.");
    if (!dateSelect) logDebug("ОШИБКА: dateSelect не найден!"); else logDebug("dateSelect найден.");
    if (!timeSelect) logDebug("ОШИБКА: timeSelect не найден!"); else logDebug("timeSelect найден.");
    if (!backToEventsBtn) logDebug("ОШИБКА: backToEventsBtn не найден!"); else logDebug("backToEventsBtn найден.");
    logDebug("initializeDOMElements: Завершение инициализации DOM элементов.");
}

function setupEventHandlers() {
    logDebug("setupEventHandlers: Начало установки обработчиков событий.");
    if (dateSelect) {
        dateSelect.onchange = () => {
          selectedDate = dateSelect.value;
          logDebug(`dateSelect.onchange: Дата изменена на ${selectedDate}`);
          // Просто перерисовываем карту мест. selectedSeats сохраняются.
          // Если вы хотите, чтобы при смене даты/времени сбрасывались выбранные места:
          // selectedSeats = [];
          drawSeatMap();
        };
        logDebug("Обработчик dateSelect.onchange установлен.");
    }

    if (timeSelect) {
        timeSelect.onchange = () => {
          selectedTime = timeSelect.value;
          logDebug(`timeSelect.onchange: Время изменено на ${selectedTime}`);
          // Аналогично, просто перерисовываем карту.
          // Если вы хотите, чтобы при смене даты/времени сбрасывались выбранные места:
          // selectedSeats = [];
          drawSeatMap();
        };
        logDebug("Обработчик timeSelect.onchange установлен.");
    }

    if (confirmBtn) {
        confirmBtn.onclick = () => {
          logDebug("confirmBtn.onclick: Нажата кнопка 'Брондау'");
          if (!selectedEvent || selectedSeats.length === 0) {
            alert("Кемінде бір орынды таңдаңыз");
            logDebug("confirmBtn.onclick: Предупреждение - не выбрано мероприятие или места.");
            return;
          }
          const data = {
            event: selectedEvent, // Отправляем весь объект selectedEvent
            seats: selectedSeats,
            date: selectedDate,
            time: selectedTime,
            // userId: tg && tg.initDataUnsafe && tg.initDataUnsafe.user ? tg.initDataUnsafe.user.id : 'unknown_user' // Для передачи ID пользователя в Airtable
          };
          logDebug(`confirmBtn.onclick: Отправка данных в Telegram: ${JSON.stringify(data)}`);
          if (tg && tg.sendData) {
              try {
                  tg.sendData(JSON.stringify(data));
                  logDebug("confirmBtn.onclick: tg.sendData вызвана успешно.");
                  // Опционально: после успешной отправки можно сбросить состояние или показать сообщение
                  // selectedSeats = [];
                  // drawSeatMap(); // Обновить карту
                  // alert("Брондау туралы ақпарат жіберілді!");
              } catch (e) {
                  logDebug(`ОШИБКА confirmBtn.onclick при вызове tg.sendData: ${e.message}`);
                  alert("Не удалось отправить данные. Ошибка API Telegram.");
              }
          } else {
              logDebug("ОШИБКА confirmBtn.onclick: tg.sendData не доступна!");
              alert("Не удалось отправить данные. Telegram API не доступно. (Для локальной проверки данные выведены в консоль)");
              console.log("Данные для отправки (локально):", data); // Для отладки без Telegram
          }
        };
        logDebug("Обработчик confirmBtn.onclick установлен.");
    }

    if (backToEventsBtn) {
        backToEventsBtn.onclick = () => {
            logDebug("backToEventsBtn.onclick: Нажата кнопка 'Назад к мероприятиям'");
            if (bookingSection) bookingSection.classList.add("fully-hidden");
            if (eventList) eventList.classList.remove("fully-hidden");
            selectedEvent = null;
            selectedSeats = []; // Сбрасываем выбранные места при возврате к списку
            logDebug("backToEventsBtn.onclick: Возврат к списку мероприятий, состояние сброшено.");
        };
        logDebug("Обработчик backToEventsBtn.onclick установлен.");
    }
    logDebug("setupEventHandlers: Завершение установки обработчиков событий.");
}

function displayEvents() {
    logDebug("displayEvents: Начало отображения мероприятий.");
    if (!eventList) {
        logDebug("ОШИБКА: displayEvents - eventList не инициализирован!");
        return;
    }
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
            logDebug(`Клик на кнопке 'Таңдау' для мероприятия ID: ${eventId}`);
            selectEvent(eventId);
        });
    });
    logDebug(`displayEvents: Мероприятия (${eventList.children.length} шт.) отображены.`);
}

function selectEvent(id) {
  logDebug(`selectEvent: Выбрано мероприятие ID: ${id}`);
  selectedEvent = events.find(e => e.id === id);
  if (!selectedEvent) {
      logDebug(`ОШИБКА selectEvent: Мероприятие с ID ${id} не найдено!`);
      alert(`Қате: ID ${id} бар іс-шара табылмады.`);
      return;
  }
  selectedSeats = []; // Сбрасываем выбранные места при выборе нового мероприятия
  // bookedSeats = []; // Эту переменную мы больше не используем для состояния

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
        logDebug(`selectEvent: Дата по умолчанию установлена на ${selectedDate}`);
      }
  }
  
  if (timeSelect) {
      timeSelect.value = selectedTime; // selectedTime уже имеет значение "16:00" по умолчанию
      logDebug(`selectEvent: Время по умолчанию установлено на ${timeSelect.value}`);
  }
  
  logDebug(`selectEvent: Перед drawSeatMap. Мероприятие: "${selectedEvent.title}", Дата: ${selectedDate}, Время: ${selectedTime}`);
  // Вместо fetchBookedSeats(), просто рисуем карту
  drawSeatMap();
}


// ЭТА ФУНКЦИЯ БОЛЬШЕ НЕ НУЖНА В ТАКОМ ВИДЕ
/*
function fetchBookedSeats() {
  logDebug(`WorkspaceBookedSeats: Начало. Мероприятие: ${selectedEvent ? selectedEvent.title : 'N/A'}, Дата: ${selectedDate}, Время: ${selectedTime}`);
  // ... старый код fetch ...
  // Теперь мы просто вызываем drawSeatMap() из обработчиков onchange для dateSelect и timeSelect,
  // и из selectEvent().
}
*/

function drawSeatMap() {
  logDebug(`drawSeatMap: Начало отрисовки. Выбранные места: ${JSON.stringify(selectedSeats)}`);
  if (!seatTable) {
    logDebug("ОШИБКА drawSeatMap: seatTable не найден!");
    return;
  }
  seatTable.innerHTML = ""; // Очищаем предыдущую карту

  if (!selectedEvent) { // Если мероприятие не выбрано (например, при первом заходе или ошибке)
      seatTable.innerHTML = '<tr><td colspan="11" class="text-center p-4">Алдымен іс-шараны таңдаңыз.</td></tr>';
      logDebug("drawSeatMap: Мероприятие не выбрано, карта не отрисована.");
      return;
  }

  for (let row = 1; row <= 10; row++) { // Предположим, у нас всегда 10 рядов
    const tr = document.createElement("tr");
    const rowLabel = document.createElement("td");
    rowLabel.textContent = `${row}-қатар`;
    rowLabel.className = "p-1 font-medium bg-gray-100 text-xs md:text-sm sticky left-0 z-10"; // Сделаем метку ряда "липкой"
    tr.appendChild(rowLabel);

    for (let col = 1; col <= 10; col++) { // И 10 мест в каждом ряду
      const seatId = `${row}-қатар ${col}-орын`;
      const td = document.createElement("td");
      td.textContent = col;

      const isSelected = selectedSeats.includes(seatId);

      td.className = "p-2 border text-center text-xs md:text-sm cursor-pointer hover:bg-green-300";

      if (isSelected) {
          td.classList.add("bg-green-500", "text-white");
          td.title = "Таңдалған орын";
      } else {
          td.classList.add("bg-gray-100");
          td.title = "Орынды таңдау";
      }
      // Все места кликабельны, так как мы не учитываем "забронированные" с сервера
      td.onclick = () => toggleSeat(td, seatId);
      tr.appendChild(td);
    }
    seatTable.appendChild(tr);
  }
  logDebug("drawSeatMap: Карта мест отрисована со всеми доступными местами.");
}

function toggleSeat(td, seatId) {
  logDebug(`toggleSeat: Клик по месту ${seatId}`);
  const index = selectedSeats.indexOf(seatId);
  if (index > -1) {
    selectedSeats.splice(index, 1);
    td.classList.remove("bg-green-500", "text-white");
    td.classList.add("bg-gray-100", "hover:bg-green-300");
    td.title = "Орынды таңдау";
    logDebug(`Место ${seatId} отменено. Выбрано: ${selectedSeats.length}`);
  } else {
    selectedSeats.push(seatId);
    td.classList.remove("bg-gray-100");
    td.classList.add("bg-green-500", "text-white");
    td.title = "Таңдалған орын";
    logDebug(`Место ${seatId} выбрано. Выбрано: ${selectedSeats.length}`);
  }
  // Можно добавить обновление информации о количестве выбранных мест где-то на странице, если нужно
  // updateSelectedCountDisplay(); 
}

function formatDateDisplay(dateStringISO) {
  const date = new Date(dateStringISO);
  const userTimezoneOffset = date.getTimezoneOffset() * 60000;
  const dateInLocal = new Date(date.getTime() + userTimezoneOffset);
  return dateInLocal.toLocaleDateString('kk-KZ', { year: 'numeric', month: 'long', day: 'numeric' });
}

document.addEventListener('DOMContentLoaded', () => {
  debugLogDiv = document.getElementById("debugLog");
  if (debugLogDiv) logDebug("DOMContentLoaded: debugLogDiv успешно найден и инициализирован.");
  else console.log("ОШИБКА DOMContentLoaded: debugLogDiv НЕ НАЙДЕН! Логи будут только в консоли.");

  logDebug("DOMContentLoaded: DOM полностью загружен и готов.");

  initializeDOMElements();
  setupEventHandlers();

  if (eventList) {
    displayEvents();
  } else {
    logDebug("ОШИБКА DOMContentLoaded: eventList не найден, displayEvents не будет вызвана!");
  }
  
  if (tg) { // Сначала проверяем, что tg вообще существует
      if (tg.MainButton) { // Затем проверяем MainButton
          try {
            // Вы можете настроить параметры, если хотите (они могут пригодиться, если вы ее потом покажете)
            tg.MainButton.setParams({ 
                text: "Таңдауды растау", 
                color: "#2563EB", 
                textColor: "#FFFFFF", 
                // is_visible: true, // Можно убрать или оставить, hide() переопределит
                is_active: false 
            });
            tg.MainButton.hide(); // <--- СКРЫВАЕМ КНОПКУ
            logDebug("DOMContentLoaded: Главная кнопка Telegram настроена и СКРЫТА.");
            
            // Обработчик tg.onEvent('mainButtonClicked', ...) можно тоже закомментировать или удалить,
            // так как скрытая кнопка не будет нажиматься.
            /*
            tg.onEvent('mainButtonClicked', function(){
                // ...
            });
            */

          } catch (e) {
            logDebug(`ОШИБКА DOMContentLoaded при настройке tg.MainButton: ${e.message}`);
          }
      } else {
          logDebug("ПРЕДУПРЕЖДЕНИЕ DOMContentLoaded: tg.MainButton не доступен.");
      }
      tg.ready(); 
      logDebug("tg.ready() шақырылды.");
  } else {
      logDebug("ПРЕДУПРЕЖДЕНИЕ DOMContentLoaded: Telegram API (tg) не доступен.");
  }
  logDebug("DOMContentLoaded: Инициализация приложения завершена.");
});

logDebug("app.js: Скрипт завершил выполнение своего первичного (синхронного) кода.");

// Опциональная функция для управления активностью кнопки Telegram
function updateTelegramMainButtonState() {
    if (tg && tg.MainButton) {
        if (selectedEvent && selectedSeats.length > 0) {
            tg.MainButton.setParams({ is_active: true });
            logDebug("Telegram MainButton стала активной.");
        } else {
            tg.MainButton.setParams({ is_active: false });
            logDebug("Telegram MainButton стала НЕ активной.");
        }
    }
}

// Вызывайте updateTelegramMainButtonState() после каждого изменения selectedSeats:
// в toggleSeat:
// ...
//   logDebug(`Место ${seatId} выбрано. Выбрано: ${selectedSeats.length}`);
// }
// updateTelegramMainButtonState(); // <-- Добавить сюда

// И при сбросе selectedSeats:
// в selectEvent:
// selectedSeats = [];
// updateTelegramMainButtonState(); // <-- Добавить сюда

// в backToEventsBtn.onclick:
// selectedSeats = [];
// updateTelegramMainButtonState(); // <-- Добавить сюда
