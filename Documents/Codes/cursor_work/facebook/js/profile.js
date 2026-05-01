window.ProfilePage = (() => {
  function render() {
    const user = StorageService.getCurrentUser();
    const posts = StorageService.allPosts().filter((p) => p.userId === user.id).sort((a, b) => b.timestamp - a.timestamp);
    const friendsIds = StorageService.friendsMap()[user.id] || [];
    const friends = friendsIds.map((id) => StorageService.userById(id)).filter(Boolean);
    const photos = posts.filter((p) => p.image).map((p) => p.image);

    $("#appContent").html(`
      <section class="surface-card p-0 mb-3 overflow-hidden">
        <img src="${user.coverPhoto}" class="w-100" style="height:260px;object-fit:cover;" alt="">
        <div class="p-3 d-flex flex-column flex-md-row align-items-start align-items-md-end gap-3">
          <img src="${user.avatar}" class="avatar" style="width:120px;height:120px;border:4px solid var(--surface);margin-top:-70px;">
          <div class="flex-grow-1">
            <h3 class="mb-1">${user.name}</h3>
            <p class="text-secondary mb-2">${user.bio || "No bio yet."}</p>
            <div class="d-flex gap-3 small text-secondary">
              <span><strong>${friends.length}</strong> Friends</span>
              <span><strong>${photos.length}</strong> Photos</span>
              <span><strong>${posts.length}</strong> Posts</span>
            </div>
          </div>
          <button class="btn btn-primary btn-sm" id="editProfileBtn"><i class="fa-solid fa-pen"></i> Edit Profile</button>
        </div>
      </section>
      <section class="surface-card p-3">
        <ul class="nav nav-tabs mb-3" id="profileTabs">
          <li class="nav-item"><button class="nav-link active" data-tab="posts">Posts</button></li>
          <li class="nav-item"><button class="nav-link" data-tab="about">About</button></li>
          <li class="nav-item"><button class="nav-link" data-tab="friends">Friends</button></li>
          <li class="nav-item"><button class="nav-link" data-tab="photos">Photos</button></li>
        </ul>
        <div id="profileTabContent">${postsTab(posts)}</div>
      </section>
    `);
    bind(posts, friends, photos, user);
  }

  function postsTab(posts) {
    if (!posts.length) return `<p class="text-secondary mb-0">No posts yet.</p>`;
    return posts.map((p) => `
      <article class="surface-card p-3 mb-3">
        <div class="small text-secondary mb-2">${StorageService.timeAgo(p.timestamp)}</div>
        <div>${App.escapeHtml(p.text)}</div>
        ${p.image ? `<img class="post-media mt-2" src="${p.image}" alt="">` : ""}
      </article>
    `).join("");
  }

  function aboutTab(user) {
    const fields = [
      ["worksAt", "Works at"],
      ["studiedAt", "Studied at"],
      ["livesIn", "Lives in"],
      ["from", "From"],
      ["relationship", "Relationship"]
    ];
    return fields.map(([k, label]) => `
      <div class="d-flex justify-content-between align-items-center border-bottom py-2">
        <div><strong>${label}:</strong> <span class="text-secondary">${user[k] || "Not set"}</span></div>
        <button class="btn btn-sm btn-light edit-about" data-key="${k}" data-label="${label}">Edit</button>
      </div>
    `).join("");
  }

  function friendsTab(friends) {
    if (!friends.length) return `<p class="text-secondary mb-0">No friends yet.</p>`;
    return `<div class="row g-2">${friends.map((f) => `
      <div class="col-md-4">
        <div class="surface-card p-2 h-100">
          <img src="${f.avatar}" class="w-100 rounded mb-2" style="height:130px;object-fit:cover;">
          <div class="fw-semibold small">${f.name}</div>
          <button class="btn btn-sm btn-outline-danger mt-2 unfriend-btn" data-user-id="${f.id}">Unfriend</button>
        </div>
      </div>`).join("")}</div>`;
  }

  function photosTab(photos) {
    if (!photos.length) return `<p class="text-secondary mb-0">No photos yet.</p>`;
    return `<div class="row g-2">${photos.map((src) => `<div class="col-6 col-md-4"><img src="${src}" class="w-100 rounded" style="height:160px;object-fit:cover;"></div>`).join("")}</div>`;
  }

  function bind(posts, friends, photos, user) {
    $(document).off("click", "#profileTabs .nav-link").on("click", "#profileTabs .nav-link", function () {
      $("#profileTabs .nav-link").removeClass("active");
      $(this).addClass("active");
      const tab = $(this).data("tab");
      if (tab === "posts") $("#profileTabContent").html(postsTab(posts));
      if (tab === "about") $("#profileTabContent").html(aboutTab(user));
      if (tab === "friends") $("#profileTabContent").html(friendsTab(friends));
      if (tab === "photos") $("#profileTabContent").html(photosTab(photos));
    });

    $(document).off("click", "#editProfileBtn").on("click", "#editProfileBtn", () => {
      const bio = prompt("Update your bio:", user.bio || "");
      if (bio === null) return;
      const users = StorageService.allUsers();
      const me = users.find((u) => u.id === user.id);
      me.bio = bio;
      StorageService.setUsers(users);
      StorageService.setCurrentUser(me);
      App.toast("Profile updated", "success");
      render();
    });

    $(document).off("click", ".edit-about").on("click", ".edit-about", function () {
      const key = $(this).data("key");
      const label = $(this).data("label");
      const value = prompt(`Update ${label}:`, user[key] || "");
      if (value === null) return;
      const users = StorageService.allUsers();
      const me = users.find((u) => u.id === user.id);
      me[key] = value;
      StorageService.setUsers(users);
      StorageService.setCurrentUser(me);
      render();
    });

    $(document).off("click", ".unfriend-btn").on("click", ".unfriend-btn", function () {
      const otherId = $(this).data("user-id");
      const me = StorageService.getCurrentUser();
      const map = StorageService.friendsMap();
      map[me.id] = (map[me.id] || []).filter((id) => id !== otherId);
      map[otherId] = (map[otherId] || []).filter((id) => id !== me.id);
      StorageService.setFriendsMap(map);
      App.toast("Friend removed", "warning");
      render();
    });
  }

  return { render };
})();
