window.FeedPage = (() => {
  const reactions = ["like", "love", "haha", "wow", "sad", "angry"];
  let renderCount = 5;

  function render(state) {
    renderCount = state.feedLoadedCount || 5;
    const user = StorageService.getCurrentUser();
    $("#appContent").html(`
      <div class="row g-3">
        <aside class="col-lg-3">
          ${leftSidebar(user)}
        </aside>
        <section class="col-lg-6" id="feedMainCol">
          ${Stories.renderRow()}
          ${composerBox(user)}
          <div id="feedList">${renderSkeletons()}</div>
        </section>
        <aside class="col-lg-3 right-col">
          ${rightSidebar()}
        </aside>
      </div>
    `);
    bind();
    Stories.bindRowEvents();
    setTimeout(renderPosts, 500);
  }

  function leftSidebar(user) {
    const friends = StorageService.friendsMap()[user.id] || [];
    const req = StorageService.friendRequestsMap()[user.id] || [];
    const suggestions = StorageService.allUsers().filter((u) => u.id !== user.id && !friends.includes(u.id)).slice(0, 3);
    return `
      <div class="surface-card p-3 mb-3">
        <div class="d-flex align-items-center gap-2">
          <img src="${user.avatar}" class="avatar" alt="">
          <div><div class="fw-semibold">${user.name}</div><a href="#profile" class="small link-muted">View profile</a></div>
        </div>
      </div>
      <div class="surface-card p-3 mb-3">
        <h6 class="mb-2">Quick Links</h6>
        ${["Friends", "Groups", "Memories", "Saved", "Events"].map((x) => `<a class="d-block link-muted mb-1" href="#">${x}</a>`).join("")}
      </div>
      <div class="surface-card p-3 mb-3">
        <h6 class="mb-2">Friend Requests</h6>
        ${req.length ? req.map((uid) => requestCard(uid)).join("") : `<small class="text-secondary">No pending requests</small>`}
      </div>
      <div class="surface-card p-3">
        <h6 class="mb-2">People You May Know</h6>
        ${suggestions.map((s) => suggestionCard(s)).join("")}
      </div>
    `;
  }

  function requestCard(uid) {
    const u = StorageService.userById(uid);
    return `
      <div class="d-flex align-items-center justify-content-between mb-2">
        <div class="d-flex align-items-center gap-2">
          <img src="${u.avatar}" class="avatar-sm" alt="">
          <div class="small">${u.name}</div>
        </div>
        <div class="btn-group btn-group-sm">
          <button class="btn btn-primary accept-request" data-user-id="${u.id}">Accept</button>
          <button class="btn btn-outline-secondary decline-request" data-user-id="${u.id}">Decline</button>
        </div>
      </div>
    `;
  }

  function suggestionCard(u) {
    return `
      <div class="d-flex align-items-center justify-content-between mb-2">
        <div class="d-flex align-items-center gap-2">
          <img src="${u.avatar}" class="avatar-sm" alt="">
          <div>
            <div class="small">${u.name}</div>
            <small class="text-secondary">${Math.floor(Math.random() * 20) + 1} mutual friends</small>
          </div>
        </div>
        <button class="btn btn-sm btn-primary add-friend" data-user-id="${u.id}">Add</button>
      </div>
    `;
  }

  function composerBox(user) {
    return `
      <div class="surface-card p-3 mb-3">
        <div class="d-flex align-items-center gap-2 mb-2">
          <img src="${user.avatar}" class="avatar" alt="">
          <div class="composer-input flex-grow-1" id="openComposer">What's on your mind, ${user.name.split(" ")[0]}?</div>
        </div>
        <div class="d-flex gap-2">
          <button class="btn btn-sm btn-light flex-fill" id="openComposerPhoto"><i class="fa-solid fa-photo-film text-success"></i> Photo/Video</button>
          <button class="btn btn-sm btn-light flex-fill" id="openComposerFeeling"><i class="fa-regular fa-face-smile text-warning"></i> Feeling</button>
          <button class="btn btn-sm btn-light flex-fill"><i class="fa-solid fa-video text-danger"></i> Live Video</button>
        </div>
      </div>
    `;
  }

  function rightSidebar() {
    const users = StorageService.allUsers().slice(1);
    return `
      <div class="surface-card p-3 mb-3">
        <h6>Sponsored</h6>
        <div class="small text-secondary">Ad placeholder for sponsors.</div>
      </div>
      <div class="surface-card p-3 mb-3">
        <h6>Birthdays</h6>
        <div class="small"><i class="fa-solid fa-gift text-danger"></i> Emma has a birthday today.</div>
      </div>
      <div class="surface-card p-3">
        <h6>Contacts</h6>
        ${users.map((u) => `<div class="d-flex align-items-center gap-2 mb-2"><img src="${u.avatar}" class="avatar-sm"><span class="small">${u.name}</span><span class="ms-auto badge rounded-pill text-bg-success">Online</span></div>`).join("")}
      </div>
    `;
  }

  function renderSkeletons() {
    return [1, 2, 3].map(() => `
      <div class="surface-card p-3 mb-3">
        <div class="skeleton mb-2" style="height:14px;width:50%"></div>
        <div class="skeleton mb-2" style="height:12px"></div>
        <div class="skeleton mb-2" style="height:12px;width:80%"></div>
        <div class="skeleton" style="height:220px"></div>
      </div>
    `).join("");
  }

  function renderPosts() {
    const posts = StorageService.allPosts().sort((a, b) => b.timestamp - a.timestamp).slice(0, renderCount);
    $("#feedList").html(posts.map(postCard).join(""));
  }

  function postCard(p) {
    const u = StorageService.userById(p.userId);
    const totals = reactionTotals(p.reactions);
    const sharedOrigin = p.sharedFrom ? StorageService.allPosts().find((x) => x.id === p.sharedFrom) : null;
    const sharedOriginUser = sharedOrigin ? StorageService.userById(sharedOrigin.userId) : null;
    return `
      <article class="surface-card p-3 mb-3 post-card" data-post-id="${p.id}">
        <div class="d-flex justify-content-between">
          <div class="d-flex gap-2">
            <img src="${u.avatar}" class="avatar" alt="">
            <div>
              <div class="fw-semibold">${u.name} ${p.feeling ? `<small class="text-secondary">is feeling ${p.feeling}</small>` : ""}</div>
              <small class="text-secondary">${StorageService.timeAgo(p.timestamp)} · ${audienceIcon(p.audience)}</small>
            </div>
          </div>
          <div class="dropdown">
            <button class="btn btn-sm btn-light" data-bs-toggle="dropdown"><i class="fa-solid fa-ellipsis"></i></button>
            <ul class="dropdown-menu dropdown-menu-end">
              <li><button class="dropdown-item edit-post">Edit Post</button></li>
              <li><button class="dropdown-item delete-post">Delete Post</button></li>
              <li><button class="dropdown-item save-post">Save Post</button></li>
              <li><button class="dropdown-item hide-post">Hide Post</button></li>
            </ul>
          </div>
        </div>
        ${p.sharedFrom ? `
          <div class="share-preview mb-3">
            <div class="small text-secondary mb-2"><i class="fa-solid fa-share"></i> Shared from ${sharedOriginUser ? sharedOriginUser.name : "a post"}</div>
            ${p.shareCaption ? `<p class="mb-2">${App.escapeHtml(p.shareCaption)}</p>` : ""}
            ${sharedOrigin ? `<div class="shared-card p-2">${App.escapeHtml(sharedOrigin.text)}${sharedOrigin.image ? `<img src="${sharedOrigin.image}" class="post-media mt-2" alt="">` : ""}</div>` : ""}
          </div>
        ` : ""}
        <p class="my-2">${App.escapeHtml(p.text)}</p>
        ${p.image ? `<img src="${p.image}" class="post-media mb-2" alt="">` : ""}
        <div class="d-flex justify-content-between small text-secondary mb-2">
          <div>${totals ? `<span class="reaction-pill">${totals}</span>` : ""}</div>
          <div>${p.comments.length} comments · ${p.shares || 0} shares</div>
        </div>
        <div class="d-flex justify-content-between border-top border-bottom py-2 mb-2">
          <button class="action-btn react-btn" data-reaction="like"><i class="fa-regular fa-thumbs-up"></i> Like</button>
          <button class="action-btn toggle-comments"><i class="fa-regular fa-comment"></i> Comment</button>
          <button class="action-btn share-post"><i class="fa-solid fa-share"></i> Share</button>
        </div>
        <div class="reaction-picker d-none mb-2">
          ${reactions.map((r) => `<button class="btn btn-sm btn-light apply-reaction" data-reaction="${r}">${r}</button>`).join(" ")}
        </div>
        <div class="comments d-none">
          ${p.comments.map((c) => commentItem(c)).join("")}
          <input class="form-control form-control-sm add-comment" placeholder="Write a comment...">
        </div>
      </article>
    `;
  }

  function commentItem(c) {
    const u = StorageService.userById(c.userId);
    return `<div class="d-flex gap-2 mb-2"><img src="${u.avatar}" class="avatar-sm"><div class="comment-box"><strong class="small">${u.name}</strong><div class="small">${App.escapeHtml(c.text)}</div></div></div>`;
  }

  function audienceIcon(aud) {
    if (aud === "friends") return `<i class="fa-solid fa-user-group"></i>`;
    if (aud === "onlyme") return `<i class="fa-solid fa-lock"></i>`;
    return `<i class="fa-solid fa-earth-americas"></i>`;
  }

  function reactionTotals(map) {
    const entries = Object.entries(map || {}).filter(([, v]) => v > 0);
    const total = entries.reduce((s, [, v]) => s + v, 0);
    if (!total) return "";
    return `${entries.slice(0, 3).map(([k]) => k).join(" ")} · ${total}`;
  }

  function bind() {
    bindComposer();
    bindPostActions();
    bindFriends();
    bindInfiniteScroll();
  }

  function bindComposer() {
    $(document).off("click", "#openComposer, #openComposerPhoto, #openComposerFeeling").on("click", "#openComposer, #openComposerPhoto, #openComposerFeeling", () => {
      $("#composerModalContent").html(`
        <div class="modal-header"><h5 class="modal-title">Create Post</h5><button class="btn-close" data-bs-dismiss="modal"></button></div>
        <div class="modal-body">
          <textarea id="composerText" class="form-control mb-2" rows="4" placeholder="Share something..."></textarea>
          <div class="row g-2 mb-2">
            <div class="col"><select id="composerAudience" class="form-select"><option value="public">Public</option><option value="friends">Friends</option><option value="onlyme">Only Me</option></select></div>
            <div class="col"><select id="composerFeeling" class="form-select"><option value="">Feeling</option><option>Happy</option><option>Excited</option><option>Grateful</option></select></div>
          </div>
          <input id="composerImage" class="form-control mb-2" placeholder="Image URL (optional)">
          <div class="d-flex gap-2">
            ${["😀", "😍", "😂", "🔥", "👏"].map((e) => `<button class="btn btn-light btn-sm add-emoji">${e}</button>`).join("")}
          </div>
        </div>
        <div class="modal-footer"><button class="btn btn-primary w-100" id="publishPost">Post</button></div>
      `);
      bootstrap.Modal.getOrCreateInstance(document.getElementById("composerModal")).show();
    });

    $(document).off("click", ".add-emoji").on("click", ".add-emoji", function () {
      const t = $("#composerText");
      t.val((t.val() + " " + $(this).text()).trim());
    });

    $(document).off("click", "#publishPost").on("click", "#publishPost", () => {
      const text = $("#composerText").val().trim();
      if (!text) return App.toast("Post text cannot be empty", "danger");
      const posts = StorageService.allPosts();
      posts.unshift({
        id: StorageService.id("post"),
        userId: StorageService.getCurrentUser().id,
        text,
        image: $("#composerImage").val().trim(),
        feeling: $("#composerFeeling").val(),
        audience: $("#composerAudience").val(),
        timestamp: StorageService.now(),
        reactions: {},
        comments: [],
        shares: 0
      });
      StorageService.setPosts(posts);
      bootstrap.Modal.getOrCreateInstance(document.getElementById("composerModal")).hide();
      renderPosts();
      App.toast("Post created", "success");
    });
  }

  function openShareModal(postId) {
    const post = StorageService.allPosts().find((x) => x.id === postId);
    const postUser = post ? StorageService.userById(post.userId) : null;
    $("#composerModalContent").html(`
      <div class="modal-header"><h5 class="modal-title">Share Post</h5><button class="btn-close" data-bs-dismiss="modal"></button></div>
      <div class="modal-body">
        <div class="mb-3">
          <strong>${postUser ? postUser.name : "Original post"}</strong>
          <div class="small text-secondary">${post ? App.escapeHtml(post.text) : ""}</div>
          ${post && post.image ? `<img src="${post.image}" class="post-media mt-2" alt="">` : ""}
        </div>
        <textarea id="shareDescription" class="form-control mb-3" rows="4" placeholder="Add a description..."></textarea>
        <div class="row g-2">
          <div class="col"><select id="shareAudience" class="form-select"><option value="public">Public</option><option value="friends">Friends</option><option value="onlyme">Only Me</option></select></div>
          <div class="col"><select id="shareFeeling" class="form-select"><option value="">Feeling</option><option>Happy</option><option>Excited</option><option>Grateful</option></select></div>
        </div>
      </div>
      <div class="modal-footer"><button class="btn btn-primary w-100" id="publishShare" data-post-id="${postId}">Share</button></div>
    `);
    bootstrap.Modal.getOrCreateInstance(document.getElementById("composerModal")).show();
  }

  function bindPostActions() {
    $(document).off("mouseenter", ".react-btn").on("mouseenter", ".react-btn", function () {
      $(this).closest(".post-card").find(".reaction-picker").removeClass("d-none");
    });
    $(document).off("mouseleave", ".post-card").on("mouseleave", ".post-card", function () {
      $(this).find(".reaction-picker").addClass("d-none");
    });

    $(document).off("click", ".apply-reaction").on("click", ".apply-reaction", function () {
      const postId = $(this).closest(".post-card").data("post-id");
      const reaction = $(this).data("reaction");
      const posts = StorageService.allPosts();
      const p = posts.find((x) => x.id === postId);
      p.reactions[reaction] = (p.reactions[reaction] || 0) + 1;
      StorageService.setPosts(posts);
      renderPosts();
      App.toast(`Reacted with ${reaction}`, "primary");
    });

    $(document).off("click", ".toggle-comments").on("click", ".toggle-comments", function () {
      $(this).closest(".post-card").find(".comments").toggleClass("d-none");
    });

    $(document).off("keypress", ".add-comment").on("keypress", ".add-comment", function (e) {
      if (e.key !== "Enter") return;
      const text = $(this).val().trim();
      if (!text) return;
      const postId = $(this).closest(".post-card").data("post-id");
      const posts = StorageService.allPosts();
      const p = posts.find((x) => x.id === postId);
      p.comments.push({ id: StorageService.id("c"), userId: StorageService.getCurrentUser().id, text, timestamp: StorageService.now() });
      StorageService.setPosts(posts);
      renderPosts();
      App.toast("Comment added", "success");
    });

    $(document).off("click", ".share-post").on("click", ".share-post", function () {
      const postId = $(this).closest(".post-card").data("post-id");
      openShareModal(postId);
    });

    $(document).off("click", "#publishShare").on("click", "#publishShare", function () {
      const sourcePostId = $(this).data("post-id");
      const caption = $("#shareDescription").val().trim();
      const audience = $("#shareAudience").val();
      const feeling = $("#shareFeeling").val();
      const posts = StorageService.allPosts();
      const sourcePost = posts.find((x) => x.id === sourcePostId);
      if (!sourcePost) return App.toast("Unable to share post", "danger");

      posts.unshift({
        id: StorageService.id("post"),
        userId: StorageService.getCurrentUser().id,
        text: caption,
        image: "",
        feeling,
        audience,
        timestamp: StorageService.now(),
        reactions: {},
        comments: [],
        shares: 0,
        sharedFrom: sourcePostId,
        shareCaption: caption
      });

      sourcePost.shares = (sourcePost.shares || 0) + 1;
      StorageService.setPosts(posts);
      bootstrap.Modal.getOrCreateInstance(document.getElementById("composerModal")).hide();
      renderPosts();
      App.toast("Post shared", "success");
    });

    $(document).off("click", ".delete-post").on("click", ".delete-post", function () {
      const postId = $(this).closest(".post-card").data("post-id");
      StorageService.setPosts(StorageService.allPosts().filter((p) => p.id !== postId));
      renderPosts();
      App.toast("Post deleted", "warning");
    });

    $(document).off("click", ".save-post").on("click", ".save-post", function () {
      const postId = $(this).closest(".post-card").data("post-id");
      const saved = StorageService.savedPosts();
      if (!saved.includes(postId)) saved.push(postId);
      StorageService.setSavedPosts(saved);
      App.toast("Post saved", "success");
    });

    $(document).off("click", ".hide-post").on("click", ".hide-post", function () {
      $(this).closest(".post-card").remove();
    });
  }

  function bindFriends() {
    $(document).off("click", ".add-friend").on("click", ".add-friend", function () {
      const user = StorageService.getCurrentUser();
      const targetId = $(this).data("user-id");
      const map = StorageService.friendRequestsMap();
      map[targetId] = map[targetId] || [];
      if (!map[targetId].includes(user.id)) map[targetId].push(user.id);
      StorageService.setFriendRequestsMap(map);
      App.toast("Friend request sent");
    });

    $(document).off("click", ".accept-request").on("click", ".accept-request", function () {
      const user = StorageService.getCurrentUser();
      const fromId = $(this).data("user-id");
      const req = StorageService.friendRequestsMap();
      req[user.id] = (req[user.id] || []).filter((id) => id !== fromId);
      StorageService.setFriendRequestsMap(req);

      const friends = StorageService.friendsMap();
      friends[user.id] = friends[user.id] || [];
      friends[fromId] = friends[fromId] || [];
      if (!friends[user.id].includes(fromId)) friends[user.id].push(fromId);
      if (!friends[fromId].includes(user.id)) friends[fromId].push(user.id);
      StorageService.setFriendsMap(friends);
      App.toast("Friend request accepted", "success");
      render(App.state);
    });

    $(document).off("click", ".decline-request").on("click", ".decline-request", function () {
      const user = StorageService.getCurrentUser();
      const fromId = $(this).data("user-id");
      const req = StorageService.friendRequestsMap();
      req[user.id] = (req[user.id] || []).filter((id) => id !== fromId);
      StorageService.setFriendRequestsMap(req);
      render(App.state);
    });
  }

  function bindInfiniteScroll() {
    $(window).off("scroll.feed").on("scroll.feed", () => {
      if (App.state.route !== "feed") return;
      if ($(window).scrollTop() + window.innerHeight + 80 >= document.body.scrollHeight) {
        renderCount += 3;
        App.state.feedLoadedCount = renderCount;
        renderPosts();
      }
    });
  }

  return { render };
})();
