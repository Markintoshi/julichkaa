const CONTACT_CONFIG = {
  whatsapp: "",
  telegram: "",
  email: "",
};

const state = {
  date: "",
  time: "",
  wishes: [],
};

const panels = [...document.querySelectorAll(".panel")];
const acceptBtn = document.querySelector("#accept-btn");
const declineBtn = document.querySelector("#decline-btn");
const declineHint = document.querySelector("#decline-hint");
const ctaZone = document.querySelector("#cta-zone");
const dateInput = document.querySelector("#date-input");
const timeGrid = document.querySelector("#time-grid");
const wishGrid = document.querySelector("#wish-grid");
const toWishesBtn = document.querySelector("#to-wishes");
const toSummaryBtn = document.querySelector("#to-summary");
const summaryCard = document.querySelector("#summary-card");
const saveBtn = document.querySelector("#save-btn");
const backBtn = document.querySelector("#back-btn");
const thanksText = document.querySelector("#thanks-text");

const declineMessages = [
  "Не-а. Эта кнопка решила сбежать.",
  "Отказ временно недоступен по романтическим причинам.",
  "Кажется, кнопка тоже за «принять».",
  "Сегодня сценарий только с хорошим финалом.",
];

function showStep(stepName) {
  panels.forEach((panel) => {
    panel.classList.toggle("is-active", panel.dataset.step === stepName);
  });
}

function setMinDate() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dateInput.min = today.toISOString().split("T")[0];
}

function moveDeclineButton() {
  const zoneRect = ctaZone.getBoundingClientRect();
  const buttonRect = declineBtn.getBoundingClientRect();
  const maxX = Math.max(12, zoneRect.width - buttonRect.width - 12);
  const maxY = Math.max(74, zoneRect.height - buttonRect.height);

  const nextX = Math.random() * maxX;
  const nextY = 74 + Math.random() * Math.max(8, maxY - 74);

  declineBtn.style.left = `${nextX}px`;
  declineBtn.style.top = `${nextY}px`;
  declineHint.textContent =
    declineMessages[Math.floor(Math.random() * declineMessages.length)];
}

function validateCalendar() {
  if (!state.date || !state.time) {
    window.alert("Нужно выбрать день и время.");
    return false;
  }

  return true;
}

function validateWishes() {
  if (!state.wishes.length) {
    window.alert("Выбери хотя бы одно желание.");
    return false;
  }

  return true;
}

function formatDate(value) {
  if (!value) return "Не выбрано";

  const formatter = new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return formatter.format(new Date(`${value}T12:00:00`));
}

function renderSummary() {
  summaryCard.innerHTML = `
    <div class="summary-row">
      <span class="summary-label">Дата</span>
      <span class="summary-value">${formatDate(state.date)}</span>
    </div>
    <div class="summary-row">
      <span class="summary-label">Время</span>
      <span class="summary-value">${state.time}</span>
    </div>
    <div class="summary-row">
      <span class="summary-label">Пожелания</span>
      <span class="summary-value">${state.wishes.join(", ")}</span>
    </div>
  `;
}

function buildMessage() {
  return [
    "Юлия ответила на приглашение.",
    `Дата: ${formatDate(state.date)}`,
    `Время: ${state.time}`,
    `Пожелания: ${state.wishes.join(", ")}`,
  ].join("\n");
}

function hasDirectContact() {
  return Boolean(
    CONTACT_CONFIG.whatsapp || CONTACT_CONFIG.telegram || CONTACT_CONFIG.email
  );
}

function persistSelection() {
  const payload = {
    ...state,
    savedAt: new Date().toISOString(),
  };

  localStorage.setItem("date-invite-selection", JSON.stringify(payload));
}

async function deliverSelection() {
  const message = buildMessage();

  if (CONTACT_CONFIG.whatsapp) {
    const phone = CONTACT_CONFIG.whatsapp.replace(/[^\d]/g, "");
    window.location.href = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    return true;
  }

  if (CONTACT_CONFIG.telegram) {
    const url = `${window.location.origin}${window.location.pathname}`;
    window.location.href = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(message)}`;
    return true;
  }

  if (CONTACT_CONFIG.email) {
    window.location.href = `mailto:${CONTACT_CONFIG.email}?subject=${encodeURIComponent("Ответ на приглашение")}&body=${encodeURIComponent(message)}`;
    return true;
  }

  if (navigator.share) {
    await navigator.share({
      title: "Ответ на приглашение",
      text: message,
    });
    return true;
  }

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(message);
    window.alert("Итог скопирован. Теперь его можно отправить Марку.");
    return true;
  }

  window.alert(message);
  return true;
}

function setSaveButtonLabel() {
  saveBtn.textContent = hasDirectContact() ? "Отправить Марку" : "Сохранить ответ";
}

acceptBtn.addEventListener("click", () => {
  showStep("calendar");
});

["pointerenter", "touchstart", "click"].forEach((eventName) => {
  declineBtn.addEventListener(
    eventName,
    (event) => {
      event.preventDefault();
      moveDeclineButton();
    },
    { passive: false }
  );
});

dateInput.addEventListener("change", (event) => {
  state.date = event.target.value;
});

timeGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-time]");
  if (!button) return;

  state.time = button.dataset.time;

  timeGrid.querySelectorAll("[data-time]").forEach((chip) => {
    chip.classList.toggle("is-selected", chip === button);
  });
});

wishGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-wish]");
  if (!button) return;

  const wish = button.dataset.wish;
  const exists = state.wishes.includes(wish);
  state.wishes = exists
    ? state.wishes.filter((item) => item !== wish)
    : [...state.wishes, wish];

  button.classList.toggle("is-selected", !exists);
});

toWishesBtn.addEventListener("click", () => {
  if (!validateCalendar()) return;
  showStep("wishes");
});

toSummaryBtn.addEventListener("click", () => {
  if (!validateWishes()) return;
  renderSummary();
  showStep("summary");
});

backBtn.addEventListener("click", () => {
  showStep("wishes");
});

saveBtn.addEventListener("click", async () => {
  try {
    persistSelection();
    await deliverSelection();
    thanksText.textContent = `Спасибо. Выбор записан ${new Intl.DateTimeFormat("ru-RU", {
      day: "numeric",
      month: "long",
    }).format(new Date())}.`;
    showStep("done");
  } catch (error) {
    window.alert("Не удалось открыть отправку. Попробуй ещё раз.");
  }
});

setMinDate();
setSaveButtonLabel();
moveDeclineButton();
