const DEFAULT_CATEGORIES = [
    "Другое",
    "Авто",
    "Дом",
    "Собака",
    "Учёба",
    "Техника"
];

let plans = loadFromStorage("plans", []);
let budget = loadFromStorage("budget", 0);
let categories = loadFromStorage("categories", DEFAULT_CATEGORIES);
let editingIndex = null;
let shownNotifications = new Set();
let currentTheme = loadFromStorage("theme", "light");
let currentCurrency = loadFromStorage("currency", "RUB");

let exchangeRates = {
    RUB: 1,
    USD: 0,
    EUR: 0,
    GBP: 0
};

document.addEventListener("DOMContentLoaded", function () {
    normalizeData();
    applyTheme();
    setupCurrency();
loadExchangeRates();
    setupTabs();

    renderCategories();
    renderPlans();

    document.getElementById("addPlanBtn").addEventListener("click", addPlan);
    document.getElementById("addCategoryBtn").addEventListener("click", addCategory);
    document.getElementById("saveBudgetBtn").addEventListener("click", saveBudget);
    document.getElementById("cancelEditBtn").addEventListener("click", cancelEdit);
    document.getElementById("notificationBtn").addEventListener("click", requestNotificationPermission);
    document.getElementById("exportBtn").addEventListener("click", exportData);
    document.getElementById("themeToggleBtn").addEventListener("click", toggleTheme);
    document.getElementById("menuToggleBtn").addEventListener("click", openSideMenu);
document.getElementById("menuCloseBtn").addEventListener("click", closeSideMenu);
document.getElementById("sideOverlay").addEventListener("click", closeSideMenu);

document.getElementById("importBtn").addEventListener("click", function () {
    document.getElementById("importFileInput").click();
});

document.getElementById("importFileInput").addEventListener("change", importData);
document.getElementById("searchInput").addEventListener("input", renderPlans);

document.getElementById("categoryFilter").addEventListener("change", renderPlans);
document.getElementById("typeFilter").addEventListener("change", renderPlans);
document.getElementById("priorityFilter").addEventListener("change", renderPlans);
document.getElementById("statusFilter").addEventListener("change", renderPlans);

    document.getElementById("newCategoryInput").addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
            addCategory();
        }
    });
});

function loadFromStorage(key, fallback) {
    try {
        const data = localStorage.getItem(key);

        if (data === null) {
            return fallback;
        }

        return JSON.parse(data);
    } catch (error) {
        return fallback;
    }
}

function savePlans() {
    localStorage.setItem("plans", JSON.stringify(plans));
}

function saveCategories() {
    localStorage.setItem("categories", JSON.stringify(categories));
}

function normalizeData() {
    if (!Array.isArray(plans)) {
        plans = [];
    }

    if (!Array.isArray(categories) || categories.length === 0) {
        categories = DEFAULT_CATEGORIES;
    }

    for (let i = 0; i < DEFAULT_CATEGORIES.length; i++) {
        if (!categories.includes(DEFAULT_CATEGORIES[i])) {
            categories.push(DEFAULT_CATEGORIES[i]);
        }
    }

    for (let i = 0; i < plans.length; i++) {
        if (!plans[i].title) {
            plans[i].title = "Без названия";
        }

        if (plans[i].amount === undefined || plans[i].amount === null || plans[i].amount === "") {
            plans[i].amount = 0;
        }

        if (!plans[i].category) {
            plans[i].category = "Другое";
        }

        if (!plans[i].priority) {
            plans[i].priority = "Низкий";
        }

        if (!plans[i].type) {
    plans[i].type = Number(plans[i].amount) > 0 ? "Покупка" : "Задача";
        }

        if (!plans[i].reminderDate) {
            plans[i].reminderDate = "";
        }

        if (plans[i].done === undefined) {
            plans[i].done = false;
        }

        if (!categories.includes(plans[i].category)) {
            categories.push(plans[i].category);
        }
    }

    savePlans();
    saveCategories();
}

function renderCategories() {
    const categoryInput = document.getElementById("categoryInput");
    const categoryFilter = document.getElementById("categoryFilter");

    categoryInput.innerHTML = "";
    categoryFilter.innerHTML = "";

    const allOption = document.createElement("option");
    allOption.value = "Все";
    allOption.textContent = "Все категории";
    categoryFilter.appendChild(allOption);

    for (let i = 0; i < categories.length; i++) {
        const category = categories[i];

        const option = document.createElement("option");
        option.value = category;
        option.textContent = category;
        categoryInput.appendChild(option);

        const filterOption = document.createElement("option");
        filterOption.value = category;
        filterOption.textContent = category;
        categoryFilter.appendChild(filterOption);
    }

    categoryInput.value = "Другое";
    categoryFilter.value = "Все";
}

function addCategory() {
    const newCategoryInput = document.getElementById("newCategoryInput");
    const newCategory = newCategoryInput.value.trim();

    if (newCategory === "") {
        alert("Введите название категории");
        return;
    }

    if (categories.includes(newCategory)) {
        alert("Такая категория уже есть");
        return;
    }

    categories.push(newCategory);
    saveCategories();

    renderCategories();

    document.getElementById("categoryInput").value = newCategory;
    newCategoryInput.value = "";
}

function addPlan() {
    const titleInput = document.getElementById("titleInput");
    const amountInput = document.getElementById("amountInput");
    const typeInput = document.getElementById("typeInput");
    const categoryInput = document.getElementById("categoryInput");
    const priorityInput = document.getElementById("priorityInput");
    const reminderInput = document.getElementById("reminderInput");

    const title = titleInput.value.trim();

    const amountText = amountInput.value.trim();
    let amount = 0;

    if (amountText !== "") {
        amount = Number(amountText);

        if (amount <= 0) {
            alert("Если указываете сумму, она должна быть больше 0");
            return;
        }
    }

    const type = typeInput.value;
    const category = categoryInput.value;
    const priority = priorityInput.value;
    const reminderDate = reminderInput.value;

    if (title === "") {
        alert("Введите название плана");
        return;
    }

    const plan = {
        title: title,
        amount: amount,
        type: type,
        category: category,
        priority: priority,
        reminderDate: reminderDate,
        done: false
    };

    if (editingIndex === null) {
        plans.push(plan);
    } else {
        plan.done = plans[editingIndex].done;
        plans[editingIndex] = plan;
        editingIndex = null;

        document.getElementById("addPlanBtn").textContent = "Добавить план";
        document.getElementById("cancelEditBtn").classList.add("hidden");
    }

    savePlans();

    titleInput.value = "";
    amountInput.value = "";
    reminderInput.value = "";
    typeInput.value = "Покупка";
    categoryInput.value = "Другое";
    priorityInput.value = "Низкий";

    renderPlans();
}
function saveBudget() {
    const budgetInput = document.getElementById("budgetInput");
    const budgetText = budgetInput.value.trim();

    if (budgetText === "") {
        budget = 0;
    } else {
        budget = Number(budgetText);

        if (budget <= 0) {
            alert("Бюджет должен быть больше 0");
            return;
        }
    }

    localStorage.setItem("budget", JSON.stringify(budget));

    budgetInput.value = "";

    renderPlans();
}

function renderBudget(total) {
    const budgetAmount = document.getElementById("budgetAmount");
    const remainingAmount = document.getElementById("remainingAmount");

    if (budget <= 0) {
        budgetAmount.textContent = "не указан";
        remainingAmount.textContent = "не указан";
        remainingAmount.className = "";
        return;
    }

    const remaining = budget - total;

    budgetAmount.textContent = formatMoney(budget);

    if (remaining >= 0) {
        remainingAmount.textContent = formatMoney(remaining);
        remainingAmount.className = "positive-money";
    } else {
        remainingAmount.textContent = "превышение на " + formatMoney(Math.abs(remaining));
        remainingAmount.className = "negative-money";
    }
}

function renderPlans() {
    const plansList = document.getElementById("plansList");
    const totalAmount = document.getElementById("totalAmount");
    const activeCount = document.getElementById("activeCount");

    plansList.innerHTML = "";

    let total = 0;
    let active = 0;

    for (let i = 0; i < plans.length; i++) {
        const plan = plans[i];

        if (!plan.done) {
            total += Number(plan.amount);
            active++;
        }
    }

    totalAmount.textContent = formatMoney(total);
    activeCount.textContent = active;

    renderBudget(total);

    let visibleCount = 0;

    for (let i = 0; i < plans.length; i++) {
        const plan = plans[i];

        if (!planMatchesFilters(plan)) {
            continue;
        }

        visibleCount++;

        const card = createPlanCard(plan, i);
        plansList.appendChild(card);
    }

    if (plans.length === 0) {
        plansList.innerHTML = '<p class="empty-text">Пока нет добавленных планов</p>';
    } else if (visibleCount === 0) {
        plansList.innerHTML = '<p class="empty-text">По выбранным фильтрам ничего не найдено</p>';
    }

    renderReminders();
}
const ACTION_ICONS = {
    edit: `
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0 0-3L17.5 5.5a2.1 2.1 0 0 0-3 0L4 16v4z"></path>
            <path d="M13.5 6.5l4 4"></path>
        </svg>
    `,
    done: `
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M20 6L9 17l-5-5"></path>
        </svg>
    `,
    return: `
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M9 14l-4-4 4-4"></path>
            <path d="M5 10h9a5 5 0 1 1 0 10h-3"></path>
        </svg>
    `,
    delete: `
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 7h16"></path>
            <path d="M10 11v6"></path>
            <path d="M14 11v6"></path>
            <path d="M6 7l1 13h10l1-13"></path>
            <path d="M9 7V4h6v3"></path>
        </svg>
    `
};

function createPlanCard(plan, index) {
    const card = document.createElement("div");
    card.className = `plan-card priority-${plan.priority.toLowerCase()}`;

    if (plan.done) {
        card.classList.add("done");
    }

    const content = document.createElement("div");

    const title = document.createElement("div");
    title.className = "plan-title";
    title.textContent = plan.done ? "✅ " + plan.title : plan.title;

    const amount = document.createElement("div");
    amount.className = "plan-amount";
    amount.textContent = formatPlanAmount(plan.amount);

    const type = document.createElement("div");
    type.className = "plan-info " + getTypeClass(plan.type);
    type.textContent = "Тип: " + plan.type;

    const category = document.createElement("div");
    category.className = "plan-info";
    category.textContent = "Категория: " + plan.category;

    const priority = document.createElement("div");
    priority.className = "plan-info " + getPriorityClass(plan.priority);
    priority.textContent = "Приоритет: " + plan.priority;

    const reminder = document.createElement("div");
    reminder.className = "plan-info";
    reminder.textContent = "Напоминание: " + formatDate(plan.reminderDate);

    content.appendChild(title);
    content.appendChild(amount);
    content.appendChild(type);
    content.appendChild(category);
    content.appendChild(priority);
    content.appendChild(reminder);

    const actionButtons = document.createElement("div");
    actionButtons.className = "action-buttons";

    const editButton = document.createElement("button");
    editButton.className = "edit-btn";
    editButton.innerHTML = ACTION_ICONS.edit;
    editButton.title = "Редактировать";

    const doneButton = document.createElement("button");
    doneButton.className = plan.done ? "return-btn" : "done-btn";
    doneButton.innerHTML = plan.done ? ACTION_ICONS.return : ACTION_ICONS.done;
    doneButton.title = plan.done ? "Вернуть" : "Выполнено";

    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-btn";
    deleteButton.innerHTML = ACTION_ICONS.delete;
    deleteButton.title = "Удалить";

    actionButtons.appendChild(doneButton);
actionButtons.appendChild(deleteButton);

card.appendChild(content);
card.appendChild(editButton);
card.appendChild(actionButtons);

    editButton.addEventListener("click", () => startEdit(index));
    doneButton.addEventListener("click", () => toggleDone(index));
    deleteButton.addEventListener("click", () => deletePlan(index));

    return card;
}
function renderReminders() {
    const remindersList = document.getElementById("remindersList");
    remindersList.innerHTML = "";

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const reminders = [];

    for (let i = 0; i < plans.length; i++) {
        const plan = plans[i];

        if (plan.done || !plan.reminderDate) {
            continue;
        }

        const reminderDate = parseDate(plan.reminderDate);

        if (isNaN(reminderDate.getTime())) {
            continue;
        }

        reminderDate.setHours(0, 0, 0, 0);

        reminders.push({
            plan: plan,
            date: reminderDate
        });
    }

    reminders.sort(function (first, second) {
        return first.date - second.date;
    });

    if (reminders.length === 0) {
        remindersList.innerHTML = '<p class="empty-text">Нет активных напоминаний</p>';
        return;
    }

    for (let i = 0; i < reminders.length; i++) {
        const reminder = reminders[i];
        const plan = reminder.plan;
        const isDue = reminder.date <= today;

        if (isDue) {
            showBrowserNotification(plan);
        }

        const item = document.createElement("div");
        item.className = isDue
            ? "reminder-item reminder-due"
            : "reminder-item reminder-upcoming";

        const amountText = Number(plan.amount) > 0 ? " · " + plan.amount + " ₽" : "";
        const statusText = isDue ? "Сегодня или просрочено" : "Запланировано";

        item.textContent = statusText + ": " + plan.title + amountText + " · " + formatDate(plan.reminderDate);
        remindersList.appendChild(item);
    }
}
function requestNotificationPermission() {
    if (!("Notification" in window)) {
        alert("Этот браузер не поддерживает уведомления");
        return;
    }

    Notification.requestPermission().then(function (permission) {
        if (permission === "granted") {
            alert("Уведомления включены");
            renderReminders();
        } else {
            alert("Уведомления не разрешены");
        }
    });
}

function showBrowserNotification(plan) {
    if (!("Notification" in window)) {
        return;
    }

    if (Notification.permission !== "granted") {
        return;
    }

    const key = plan.title + plan.reminderDate;

    if (shownNotifications.has(key)) {
        return;
    }

    shownNotifications.add(key);

    const text = Number(plan.amount) > 0
        ? plan.amount + " ₽"
        : "Без суммы";

    new Notification("Напоминание", {
        body: plan.title + " — " + text
    });
}

function planMatchesFilters(plan) {
    const searchText = document.getElementById("searchInput").value.trim().toLowerCase();

    const categoryFilter = document.getElementById("categoryFilter").value;
    const typeFilter = document.getElementById("typeFilter").value;
    const priorityFilter = document.getElementById("priorityFilter").value;
    const statusFilter = document.getElementById("statusFilter").value;

    const title = String(plan.title).toLowerCase();
    const category = String(plan.category).toLowerCase();

    if (searchText !== "" && !title.includes(searchText) && !category.includes(searchText)) {
        return false;
    }

    if (categoryFilter !== "Все" && plan.category !== categoryFilter) {
        return false;
    }

    if (typeFilter !== "Все" && plan.type !== typeFilter) {
        return false;
    }

    if (priorityFilter !== "Все" && plan.priority !== priorityFilter) {
        return false;
    }

    if (statusFilter === "Активные" && plan.done) {
        return false;
    }

    if (statusFilter === "Выполненные" && !plan.done) {
        return false;
    }

    return true;
}

function startEdit(index) {
    const plan = plans[index];

    document.getElementById("titleInput").value = plan.title;
    document.getElementById("amountInput").value = Number(plan.amount) > 0 ? plan.amount : "";
    document.getElementById("typeInput").value = plan.type;
    document.getElementById("categoryInput").value = plan.category;
    document.getElementById("priorityInput").value = plan.priority;
    document.getElementById("reminderInput").value = plan.reminderDate;

    editingIndex = index;

    document.getElementById("addPlanBtn").textContent = "Сохранить изменения";
    document.getElementById("cancelEditBtn").classList.remove("hidden");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

function cancelEdit() {
    editingIndex = null;

    document.getElementById("titleInput").value = "";
    document.getElementById("amountInput").value = "";
    document.getElementById("reminderInput").value = "";
    document.getElementById("typeInput").value = "Покупка";
    document.getElementById("categoryInput").value = "Другое";
    document.getElementById("priorityInput").value = "Низкий";

    document.getElementById("addPlanBtn").textContent = "Добавить план";
    document.getElementById("cancelEditBtn").classList.add("hidden");
}

function toggleDone(index) {
    plans[index].done = !plans[index].done;
    savePlans();
    renderPlans();
}

function deletePlan(index) {
    plans.splice(index, 1);
    savePlans();
    renderPlans();
}

function getPriorityClass(priority) {
    if (priority === "Высокий") {
        return "priority-high";
    }

    if (priority === "Средний") {
        return "priority-medium";
    }

    return "priority-low";
}

function getTypeClass(type) {
    if (type === "Покупка") {
        return "type-buy";
    }

    if (type === "Задача") {
        return "type-task";
    }

    return "";
}

function formatDate(date) {
    if (!date) {
        return "не указано";
    }

    const parts = date.split("-");

    if (parts.length !== 3) {
        return "не указано";
    }

    return parts[2] + "." + parts[1] + "." + parts[0];
}

function parseDate(date) {
    const parts = date.split("-");
    return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
}
function exportData() {
    const data = {
        plans: plans,
        categories: categories,
        budget: budget,
        exportedAt: new Date().toISOString()
    };

    const json = JSON.stringify(data, null, 2);

    const blob = new Blob([json], {
        type: "application/json"
    });

    const url = URL.createObjectURL(blob);

    const today = new Date();
    const dateText = today.toISOString().split("T")[0];

    const link = document.createElement("a");
    link.href = url;
    link.download = "finance-planner-backup-" + dateText + ".json";

    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function importData(event) {
    const file = event.target.files[0];

    if (!file) {
        return;
    }

    const reader = new FileReader();

    reader.onload = function () {
        try {
            const data = JSON.parse(reader.result);

            if (!data.plans || !Array.isArray(data.plans)) {
                alert("Файл повреждён или не подходит");
                return;
            }

            const confirmImport = confirm(
                "Загрузить резервную копию? Текущие данные будут заменены."
            );

            if (!confirmImport) {
                return;
            }

            plans = data.plans;

            if (Array.isArray(data.categories)) {
                categories = data.categories;
            } else {
                categories = DEFAULT_CATEGORIES;
            }

            if (data.budget !== undefined && data.budget !== null) {
                budget = Number(data.budget);
            } else {
                budget = 0;
            }

            if (isNaN(budget) || budget < 0) {
                budget = 0;
            }

            localStorage.setItem("plans", JSON.stringify(plans));
            localStorage.setItem("categories", JSON.stringify(categories));
            localStorage.setItem("budget", JSON.stringify(budget));

            normalizeData();

            renderCategories();
            renderPlans();

            document.getElementById("categoryFilter").value = "Все";
            document.getElementById("priorityFilter").value = "Все";
            document.getElementById("statusFilter").value = "Все";

            if (document.getElementById("typeFilter")) {
                document.getElementById("typeFilter").value = "Все";
            }

            cancelEdit();

            alert("Резервная копия загружена");

        } catch (error) {
            alert("Не удалось прочитать файл");
        }

        event.target.value = "";
    };

    reader.readAsText(file);
}
function applyTheme() {
    const themeToggleBtn = document.getElementById("themeToggleBtn");

    if (currentTheme === "dark") {
        document.documentElement.setAttribute("data-theme", "dark");
        themeToggleBtn.textContent = "☀️";
        themeToggleBtn.title = "Светлая тема";
    } else {
        document.documentElement.removeAttribute("data-theme");
        themeToggleBtn.textContent = "🌙";
        themeToggleBtn.title = "Тёмная тема";
    }
}

function toggleTheme() {
    currentTheme = currentTheme === "dark" ? "light" : "dark";
    localStorage.setItem("theme", JSON.stringify(currentTheme));
    applyTheme();
}
function setupTabs() {
    const tabButtons = document.querySelectorAll("[data-tab-btn]");
    const tabPages = document.querySelectorAll("[data-tab-page]");

    for (let i = 0; i < tabButtons.length; i++) {
        tabButtons[i].addEventListener("click", function () {
            const tabName = tabButtons[i].dataset.tabBtn;

            for (let j = 0; j < tabButtons.length; j++) {
                tabButtons[j].classList.remove("active");
            }

            for (let j = 0; j < tabPages.length; j++) {
                tabPages[j].classList.remove("active");
            }

            tabButtons[i].classList.add("active");

            for (let j = 0; j < tabPages.length; j++) {
                if (tabPages[j].dataset.tabPage === tabName) {
                    tabPages[j].classList.add("active");
                }
            }

            localStorage.setItem("activeTab", JSON.stringify(tabName));
            closeSideMenu();
        });
    }

    const savedTab = loadFromStorage("activeTab", "plans");
    const savedButton = document.querySelector('[data-tab-btn="' + savedTab + '"]');

    if (savedButton) {
        savedButton.click();
    } else if (tabButtons[0]) {
        tabButtons[0].click();
    }
}

function openSideMenu() {
    document.body.classList.add("menu-open");
}

function closeSideMenu() {
    document.body.classList.remove("menu-open");
}
function setupCurrency() {
    const currencyInput = document.getElementById("currencyInput");

    if (!currencyInput) {
        return;
    }

    currencyInput.value = currentCurrency;

    currencyInput.addEventListener("change", function () {
        currentCurrency = currencyInput.value;
        localStorage.setItem("currency", JSON.stringify(currentCurrency));

        renderExchangeRateInfo();
        renderPlans();
    });
}

async function loadExchangeRates() {
    try {
        const response = await fetch("https://www.cbr-xml-daily.ru/daily_json.js");
        const data = await response.json();

        exchangeRates.USD = data.Valute.USD.Value / data.Valute.USD.Nominal;
        exchangeRates.EUR = data.Valute.EUR.Value / data.Valute.EUR.Nominal;
        exchangeRates.GBP = data.Valute.GBP.Value / data.Valute.GBP.Nominal;

        renderExchangeRateInfo();
        renderPlans();
    } catch (error) {
        renderExchangeRateInfo("Не удалось загрузить курсы. Показаны рубли.");
    }
}

function formatMoney(amountRub) {
    const amount = Number(amountRub);

    if (currentCurrency === "RUB" || !exchangeRates[currentCurrency]) {
        return Math.round(amount) + " ₽";
    }

    const converted = amount / exchangeRates[currentCurrency];

    return new Intl.NumberFormat("ru-RU", {
        style: "currency",
        currency: currentCurrency,
        maximumFractionDigits: 2
    }).format(converted);
}

function formatPlanAmount(amountRub) {
    const amount = Number(amountRub);

    if (amount <= 0) {
        return "Без суммы";
    }

    if (currentCurrency === "RUB") {
        return formatMoney(amount);
    }

    return amount + " ₽ ≈ " + formatMoney(amount);
}

function renderExchangeRateInfo(message) {
    const exchangeRateInfo = document.getElementById("exchangeRateInfo");

    if (!exchangeRateInfo) {
        return;
    }

    if (message) {
        exchangeRateInfo.textContent = message;
        return;
    }

    if (currentCurrency === "RUB") {
        exchangeRateInfo.textContent = "Основная валюта: рубли";
        return;
    }

    if (!exchangeRates[currentCurrency]) {
        exchangeRateInfo.textContent = "Курс загружается...";
        return;
    }

    exchangeRateInfo.textContent = "1 " + currentCurrency + " ≈ " + exchangeRates[currentCurrency].toFixed(2) + " ₽";
}