let tg = window.Telegram.WebApp;
tg.expand();

const container = document.querySelector('.container');
const cartElement = document.getElementById('cart');

let cart = {};

const events = [
  { id: 1, name: "Концерт The Beatles", date: "25 фев", venue: "Театр Армана", price: 5000, image: "beatles.jpg" },
  { id: 2, name: "Лебединое озеро", date: "10 мар", venue: "Городской театр", price: 7000, image: "swanlake.jpg" }
];

function renderEvents() {
  container.innerHTML = "";
  events.forEach(event => {
    const itemDiv = document.createElement('div');
    itemDiv.className = "item";
    itemDiv.innerHTML = \`
      <img src="\${event.image}" class="img" />
      <p><strong>\${event.name}</strong></p>
      <p>\${event.date} - \${event.venue}</p>
      <p>\${event.price} KZT</p>
      <button class="btn select-event" data-id="\${event.id}">Выбрать</button>
    \`;
    container.appendChild(itemDiv);
  });
}

container.addEventListener('click', e => {
  if (e.target.classList.contains('select-event')) {
    const eventId = parseInt(e.target.dataset.id);
    showSeatSelection(eventId);
  } else if (e.target.classList.contains('seat')) {
    const eventId = parseInt(e.target.dataset.event);
    const seat = e.target.dataset.seat;
    cart[eventId] = cart[eventId] || [];
    if (cart[eventId].includes(seat)) {
      cart[eventId] = cart[eventId].filter(s => s !== seat);
      e.target.classList.remove('selected');
    } else {
      cart[eventId].push(seat);
      e.target.classList.add('selected');
    }
    updateCart();
    updateMainButton();
  }
});

function showSeatSelection(eventId) {
  const event = events.find(e => e.id === eventId);
  container.innerHTML = \`<h3>\${event.name} — Выберите места</h3>\`;
  for (let i = 1; i <= 10; i++) {
    const btn = document.createElement('button');
    btn.className = "btn seat";
    btn.dataset.event = eventId;
    btn.dataset.seat = i;
    btn.innerText = "Место " + i;
    container.appendChild(btn);
  }
}

function updateCart() {
  cartElement.innerHTML = "<h4>Выбранные места:</h4>";
  let total = 0;
  for (const eventId in cart) {
    const event = events.find(e => e.id == eventId);
    const seats = cart[eventId];
    total += seats.length * event.price;
    cartElement.innerHTML += \`<p>\${event.name}: \${seats.join(', ')} (\${event.price * seats.length} KZT)</p>\`;
  }
  cartElement.innerHTML += \`<p><strong>Итого: \${total} KZT</strong></p>\`;
}

function updateMainButton() {
  if (Object.keys(cart).length > 0) {
    tg.MainButton.setText("Забронировать");
    tg.MainButton.show();
    tg.MainButton.onClick(() => {
      tg.sendData(JSON.stringify(cart));
    });
  } else {
    tg.MainButton.hide();
  }
}

tg.ready(() => {
  renderEvents();
});
