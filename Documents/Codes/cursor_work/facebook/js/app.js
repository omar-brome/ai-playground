window.App = (() => {
  const state = {
    route: "feed",
    feedLoadedCount: 5
  };

  const routes = ["login", "feed", "profile", "notifications"];

  function init() {
    StorageService.seedIfNeeded();
    applyTheme(StorageService.getTheme());
    bindGlobalEvents();
    renderNavbar();
    routeTo(resolveRoute());
  }

  function resolveRoute() {
    const hash = location.hash.replace("#", "");
    if (routes.includes(hash)) return hash;
    return StorageService.getCurrentUser() ? "feed" : "login";
  }

  function routeTo(route, opts = {}) {
    state.route = route;
    if (!opts.skipHash) location.hash = route;

    const user = StorageService.getCurrentUser();
    if (!user && route !== "login") return routeTo("login");
    if (user && route === "login") return routeTo("feed");

    renderNavbar();
    renderBottomNav();

    if (route === "login") return AuthPage.render();
    if (route === "feed") return FeedPage.render(state);
    if (route === "profile") return ProfilePage.render();
    if (route === "notifications") return NotificationsPage.render();
  }

  function renderNavbar() {
    const user = StorageService.getCurrentUser();
    if (!user) {
      $("#appNavbar").html("");
      return;
    }
    const notifications = StorageService.allNotifications().filter((n) => !n.read).length;
    $("#appNavbar").html(`
      <nav class="top-nav px-2 px-md-3 py-2 d-flex align-items-center justify-content-between gap-2">
        <div class="d-flex align-items-center gap-2">
          <i class="fa-brands fa-facebook fs-3 app-logo"></i>
          <span class="fw-bold">FaceSpace</span>
        </div>
        <div class="d-none d-md-flex align-items-center gap-2">
          ${navBtn("feed", "fa-house")}
          ${navBtn("friends", "fa-user-group", true)}
          ${navBtn("watch", "fa-tv", true)}
          ${navBtn("marketplace", "fa-shop", true)}
        </div>
        <div class="d-flex align-items-center gap-2">
          <div class="d-none d-md-block">
            <input id="globalSearch" class="form-control form-control-sm" placeholder="Search FaceSpace">
          </div>
          <button id="openMessenger" class="nav-icon-btn"><i class="fa-brands fa-facebook-messenger"></i></button>
          <button class="nav-icon-btn position-relative" data-route="notifications">
            <i class="fa-solid fa-bell"></i>
            ${notifications ? `<span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">${notifications}</span>` : ""}
          </button>
          <div class="dropdown">
            <button class="btn btn-sm p-0 border-0" data-bs-toggle="dropdown">
              <img src="${user.avatar}" class="avatar" alt="avatar">
            </button>
            <ul class="dropdown-menu dropdown-menu-end">
              <li><button class="dropdown-item" data-route="profile">View Profile</button></li>
              <li><button class="dropdown-item" id="toggleTheme">Toggle Dark Mode</button></li>
              <li><hr class="dropdown-divider"></li>
              <li><button class="dropdown-item text-danger" id="logoutBtn">Logout</button></li>
            </ul>
          </div>
        </div>
      </nav>
    `);
  }

  function navBtn(route, icon, disabled = false) {
    return `<button class="nav-icon-btn ${state.route === route ? "active" : ""}" ${disabled ? "disabled" : `data-route="${route}"`}><i class="fa-solid ${icon}"></i></button>`;
  }

  function renderBottomNav() {
    const user = StorageService.getCurrentUser();
    if (!user) return $("#mobileBottomNav").html("");
    $("#mobileBottomNav").html(`
      <div class="bottom-nav d-flex justify-content-around py-2">
        <button class="btn ${state.route === "feed" ? "active" : ""}" data-route="feed"><i class="fa-solid fa-house"></i></button>
        <button class="btn" disabled><i class="fa-solid fa-user-group"></i></button>
        <button class="btn ${state.route === "notifications" ? "active" : ""}" data-route="notifications"><i class="fa-solid fa-bell"></i></button>
        <button class="btn ${state.route === "profile" ? "active" : ""}" data-route="profile"><i class="fa-solid fa-user"></i></button>
      </div>
    `);
  }

  function bindGlobalEvents() {
    $(window).on("hashchange", () => routeTo(resolveRoute(), { skipHash: true }));

    $(document).on("click", "[data-route]", function () {
      const route = $(this).data("route");
      if (routes.includes(route)) routeTo(route);
    });

    $(document).on("click", "#logoutBtn", () => {
      StorageService.clearCurrentUser();
      toast("Logged out successfully");
      routeTo("login");
    });

    $(document).on("click", "#toggleTheme", () => {
      const next = StorageService.getTheme() === "dark" ? "light" : "dark";
      StorageService.setTheme(next);
      applyTheme(next);
    });

    $(document).on("click", "#openMessenger", () => {
      $("#messengerSidebar").toggleClass("open");
      renderMessengerSidebar();
    });
  }

  function renderMessengerSidebar() {
    const user = StorageService.getCurrentUser();
    if (!user) return;
    const contacts = StorageService.allUsers().filter((u) => u.id !== user.id);
    $("#messengerSidebar").html(`
      <div class="d-flex justify-content-between align-items-center mb-2">
        <h6 class="mb-0">Chats</h6>
        <button class="btn btn-sm btn-light" id="closeMessenger"><i class="fa-solid fa-xmark"></i></button>
      </div>
      ${contacts.map((c) => `
        <button class="btn w-100 text-start d-flex align-items-center gap-2 mb-1 open-chat" data-user-id="${c.id}">
          <img src="${c.avatar}" class="avatar-sm" alt="">
          <span>${c.name}</span>
        </button>
      `).join("")}
    `);
    $(document).off("click", "#closeMessenger").on("click", "#closeMessenger", () => $("#messengerSidebar").removeClass("open"));
    $(document).off("click", ".open-chat").on("click", ".open-chat", function () {
      const otherId = $(this).data("user-id");
      openChatBubble(otherId);
    });
  }

  function conversationId(a, b) {
    return [a, b].sort().join("__");
  }

  function openChatBubble(otherId) {
    const user = StorageService.getCurrentUser();
    const other = StorageService.userById(otherId);
    const cid = conversationId(user.id, otherId);
    const messagesMap = StorageService.messagesMap();
    const messages = messagesMap[cid] || [];

    if ($(`#chat_${otherId}`).length) return;
    $("#chatDock").append(`
      <div class="chat-bubble" id="chat_${otherId}">
        <div class="d-flex align-items-center justify-content-between p-2 border-bottom">
          <div class="d-flex align-items-center gap-2">
            <img src="${other.avatar}" class="avatar-sm" alt="">
            <strong class="small">${other.name}</strong>
          </div>
          <div class="d-flex gap-1">
            <button class="btn btn-sm btn-light minimize-chat" data-user-id="${otherId}"><i class="fa-solid fa-minus"></i></button>
            <button class="btn btn-sm btn-light close-chat" data-user-id="${otherId}"><i class="fa-solid fa-xmark"></i></button>
          </div>
        </div>
        <div class="p-2 chat-body" style="height:180px; overflow:auto;">
          ${messages.map((m) => `<div class="small mb-1 ${m.senderId === user.id ? "text-end" : ""}"><span class="badge text-bg-light">${escapeHtml(m.text)}</span></div>`).join("")}
        </div>
        <div class="p-2 border-top">
          <input class="form-control form-control-sm chat-input" data-user-id="${otherId}" placeholder="Type message...">
        </div>
      </div>
    `);
  }

  function bindChatSend(input) {
    const otherId = $(input).data("user-id");
    const text = $(input).val().trim();
    if (!text) return;
    const user = StorageService.getCurrentUser();
    const cid = conversationId(user.id, otherId);
    const map = StorageService.messagesMap();
    map[cid] = map[cid] || [];
    map[cid].push({ senderId: user.id, text, timestamp: StorageService.now() });
    StorageService.setMessagesMap(map);
    $(input).val("");
    $(`#chat_${otherId} .chat-body`).append(`<div class="small mb-1 text-end"><span class="badge text-bg-light">${escapeHtml(text)}</span></div>`);
  }

  $(document).on("keypress", ".chat-input", function (e) {
    if (e.key === "Enter") bindChatSend(this);
  });
  $(document).on("click", ".close-chat", function () {
    $(`#chat_${$(this).data("user-id")}`).remove();
  });
  $(document).on("click", ".minimize-chat", function () {
    $(`#chat_${$(this).data("user-id")} .chat-body, #chat_${$(this).data("user-id")} .border-top`).toggle();
  });

  function applyTheme(theme) {
    $("body").toggleClass("dark", theme === "dark");
  }

  function toast(msg, type = "primary") {
    const id = StorageService.id("t");
    $("#toastContainer").append(`
      <div id="${id}" class="toast align-items-center text-bg-${type} border-0" role="alert">
        <div class="d-flex">
          <div class="toast-body">${escapeHtml(msg)}</div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
      </div>
    `);
    const el = document.getElementById(id);
    const t = new bootstrap.Toast(el, { delay: 2200 });
    t.show();
    el.addEventListener("hidden.bs.toast", () => el.remove());
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (s) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[s]));
  }

  return { init, routeTo, toast, escapeHtml, state };
})();

$(function () {
  App.init();
});
