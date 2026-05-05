window.NotificationsPage = (() => {
  function render() {
    const notes = StorageService.allNotifications().sort((a, b) => b.timestamp - a.timestamp);
    $("#appContent").html(`
      <div class="row justify-content-center">
        <div class="col-12 col-lg-8">
          <div class="surface-card p-3">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h5 class="mb-0">Notifications</h5>
              <button class="btn btn-sm btn-light" id="markAllRead">Mark all as read</button>
            </div>
            <div id="notificationsList">
              ${notes.map(item).join("") || `<p class="text-secondary mb-0">No notifications.</p>`}
            </div>
          </div>
        </div>
      </div>
    `);
    bind();
  }

  function item(n) {
    const from = StorageService.userById(n.fromUserId) || { name: "System", avatar: "https://ui-avatars.com/api/?name=System" };
    return `
      <div class="d-flex align-items-start gap-2 p-2 rounded mb-2 ${n.read ? "" : "unread-notification"}" data-note-id="${n.id}">
        <img src="${from.avatar}" class="avatar-sm" alt="">
        <div class="flex-grow-1">
          <div class="small">${message(n, from.name)}</div>
          <small class="text-secondary">${StorageService.timeAgo(n.timestamp)}</small>
        </div>
      </div>
    `;
  }

  function message(n, name) {
    if (n.type === "like") return `<strong>${name}</strong> liked your post.`;
    if (n.type === "comment") return `<strong>${name}</strong> commented on your post.`;
    if (n.type === "friend_request") return `<strong>${name}</strong> sent you a friend request.`;
    if (n.type === "birthday") return `It's <strong>${name}</strong>'s birthday today.`;
    return "You have a new notification.";
  }

  function bind() {
    $(document).off("click", "#markAllRead").on("click", "#markAllRead", () => {
      const notes = StorageService.allNotifications().map((n) => ({ ...n, read: true }));
      StorageService.setNotifications(notes);
      App.toast("All notifications marked as read");
      render();
    });
  }

  return { render };
})();
