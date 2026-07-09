const MANAGER_ID = "manager";
const MANAGER_PASSWORD_HASH = "866485796cfa8d7c0cf7111640205b83076433547577511d81f8030ae99ecea5";

const loginView = document.querySelector("#loginView");
const registerView = document.querySelector("#registerView");
const taskView = document.querySelector("#taskView");
const loginForm = document.querySelector("#loginForm");
const registerForm = document.querySelector("#registerForm");
const loginError = document.querySelector("#loginError");
const registerMessage = document.querySelector("#registerMessage");
const logoutBtn = document.querySelector("#logoutBtn");
const showRegisterBtn = document.querySelector("#showRegisterBtn");
const backToLoginBtn = document.querySelector("#backToLoginBtn");
const taskForm = document.querySelector("#taskForm");
const taskTableBody = document.querySelector("#taskTableBody");
const activeManager = document.querySelector("#activeManager");

const sessionKey = "managerLoggedIn";
const currentManagerKey = "currentManagerId";
const managersKey = "registeredManagers";
const tasksKey = "managerTasks";
const views = [loginView, registerView, taskView];

const defaultManagers = [
  {
    managerId: MANAGER_ID,
    passwordHash: MANAGER_PASSWORD_HASH,
  },
];

async function sha256(value) {
  const encodedValue = new TextEncoder().encode(value);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encodedValue);

  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function isAuthenticated() {
  return localStorage.getItem(sessionKey) === "true";
}

function getCurrentManagerId() {
  return localStorage.getItem(currentManagerKey);
}

function getManagers() {
  const savedManagers = JSON.parse(localStorage.getItem(managersKey) || "[]");
  const managerMap = new Map(defaultManagers.map((manager) => [manager.managerId, manager]));

  savedManagers.forEach((manager) => {
    managerMap.set(manager.managerId, manager);
  });

  return Array.from(managerMap.values());
}

function saveManagers(managers) {
  const customManagers = managers.filter((manager) => manager.managerId !== MANAGER_ID);
  localStorage.setItem(managersKey, JSON.stringify(customManagers));
}

function findManager(managerId) {
  return getManagers().find((manager) => manager.managerId.toLowerCase() === managerId.toLowerCase());
}

function getTasks() {
  return JSON.parse(localStorage.getItem(tasksKey) || "[]");
}

function getCurrentManagerTasks() {
  const currentManagerId = getCurrentManagerId();

  return getTasks().filter((task) => task.managerId === currentManagerId);
}

function saveTasks(tasks) {
  localStorage.setItem(tasksKey, JSON.stringify(tasks));
}

function createTaskId() {
  if (crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function showView(activeView) {
  views.forEach((view) => view.classList.toggle("hidden", view !== activeView));
}

function showTaskView() {
  if (!isAuthenticated()) {
    showLoginView();
    return;
  }

  activeManager.textContent = `Logged in as ${getCurrentManagerId()}`;
  showView(taskView);
  renderTasks();
}

function showLoginView() {
  showView(loginView);
}

function showRegisterView() {
  loginError.textContent = "";
  registerMessage.textContent = "";
  registerMessage.classList.remove("success");
  showView(registerView);
}

function formatStatus(status) {
  return status === "completed" ? "Completed" : "Not completed";
}

function renderTasks() {
  if (!isAuthenticated()) {
    showLoginView();
    return;
  }

  const tasks = getCurrentManagerTasks();
  taskTableBody.replaceChildren();

  if (tasks.length === 0) {
    const emptyRow = document.createElement("tr");
    const emptyCell = document.createElement("td");

    emptyCell.colSpan = 3;
    emptyCell.textContent = "No tasks added yet.";
    emptyRow.append(emptyCell);
    taskTableBody.append(emptyRow);
    return;
  }

  tasks.forEach((task) => {
    const row = document.createElement("tr");
    const titleCell = document.createElement("td");
    const statusCell = document.createElement("td");
    const actionCell = document.createElement("td");
    const statusBadge = document.createElement("span");
    const toggleButton = document.createElement("button");

    titleCell.textContent = task.title;
    statusBadge.className = `status ${task.status === "completed" ? "completed" : "not-completed"}`;
    statusBadge.textContent = formatStatus(task.status);
    toggleButton.className = "secondary";
    toggleButton.type = "button";
    toggleButton.dataset.taskId = task.id;
    toggleButton.textContent = "Toggle";

    statusCell.append(statusBadge);
    actionCell.append(toggleButton);
    row.append(titleCell, statusCell, actionCell);
    taskTableBody.append(row);
  });
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(loginForm);
  const managerId = formData.get("managerId").trim();
  const password = formData.get("password");
  const passwordHash = await sha256(password);
  const manager = findManager(managerId);

  if (manager && passwordHash === manager.passwordHash) {
    localStorage.setItem(sessionKey, "true");
    localStorage.setItem(currentManagerKey, manager.managerId);
    loginError.textContent = "";
    loginForm.reset();
    showTaskView();
    return;
  }

  loginError.textContent = "Invalid manager ID or password.";
});

registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(registerForm);
  const managerId = formData.get("newManagerId").trim();
  const password = formData.get("newPassword");
  const confirmPassword = formData.get("confirmPassword");

  registerMessage.classList.remove("success");

  if (!managerId) {
    registerMessage.textContent = "Manager ID is required.";
    return;
  }

  if (findManager(managerId)) {
    registerMessage.textContent = "This manager ID already exists.";
    return;
  }

  if (password !== confirmPassword) {
    registerMessage.textContent = "Passwords do not match.";
    return;
  }

  const managers = getManagers();
  managers.push({
    managerId,
    passwordHash: await sha256(password),
  });
  saveManagers(managers);

  registerForm.reset();
  registerMessage.classList.add("success");
  registerMessage.textContent = "Manager registered successfully. You can login now.";
});

logoutBtn.addEventListener("click", () => {
  localStorage.removeItem(sessionKey);
  localStorage.removeItem(currentManagerKey);
  showLoginView();
});

showRegisterBtn.addEventListener("click", showRegisterView);
backToLoginBtn.addEventListener("click", showLoginView);

taskForm.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!isAuthenticated()) {
    showLoginView();
    return;
  }

  const formData = new FormData(taskForm);
  const title = formData.get("taskTitle").trim();
  const status = formData.get("taskStatus");

  if (!title) {
    return;
  }

  const tasks = getTasks();
  tasks.push({
    id: createTaskId(),
    managerId: getCurrentManagerId(),
    title,
    status,
    createdAt: new Date().toISOString(),
  });

  saveTasks(tasks);
  taskForm.reset();
  renderTasks();
});

taskTableBody.addEventListener("click", (event) => {
  if (!isAuthenticated()) {
    showLoginView();
    return;
  }

  const button = event.target.closest("[data-task-id]");

  if (!button) {
    return;
  }

  const currentManagerId = getCurrentManagerId();
  const tasks = getTasks().map((task) =>
    task.id === button.dataset.taskId && task.managerId === currentManagerId
      ? { ...task, status: task.status === "completed" ? "not_completed" : "completed" }
      : task,
  );

  saveTasks(tasks);
  renderTasks();
});

if (isAuthenticated()) {
  showTaskView();
} else {
  showLoginView();
}
