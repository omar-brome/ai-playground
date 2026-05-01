window.Stories = (() => {
  let timer = null;
  let progressTimer = null;
  let list = [];
  let idx = 0;

  function renderRow() {
    const user = StorageService.getCurrentUser();
    const stories = StorageService.allStories().sort((a, b) => b.timestamp - a.timestamp);
    return `
      <div class="surface-card p-3 mb-3">
        <div class="story-row">
          <div class="story-card open-creator" title="Create Story">
            <img src="${user.avatar}" alt="">
            <div class="label"><i class="fa-solid fa-plus"></i> Create Story</div>
          </div>
          ${stories.slice(0, 12).map((s, i) => {
            const u = StorageService.userById(s.userId);
            return `
              <div class="story-card open-story" data-story-index="${i}">
                <img src="${s.image}" alt="">
                <div class="label">${u ? u.name : "User"}</div>
              </div>`;
          }).join("")}
        </div>
      </div>
    `;
  }

  function bindRowEvents() {
    $(document).off("click", ".open-story").on("click", ".open-story", function () {
      list = StorageService.allStories().sort((a, b) => b.timestamp - a.timestamp).slice(0, 12);
      idx = Number($(this).data("story-index"));
      openViewer();
    });
  }

  function openViewer() {
    renderViewer();
    new bootstrap.Modal("#storyViewerModal").show();
    scheduleNext();
  }

  function renderViewer() {
    const s = list[idx];
    if (!s) return;
    const u = StorageService.userById(s.userId);
    $("#storyViewerContent").html(`
      <div class="p-3">
        <div class="story-progress mb-3"><div class="bar" id="storyProgressBar"></div></div>
        <div class="d-flex justify-content-between align-items-center mb-2">
          <div class="d-flex align-items-center gap-2">
            <img src="${u.avatar}" class="avatar-sm" alt="">
            <strong>${u.name}</strong>
            <small class="text-light-emphasis">${StorageService.timeAgo(s.timestamp)}</small>
          </div>
          <button class="btn btn-sm btn-light" data-bs-dismiss="modal"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <img src="${s.image}" class="w-100 rounded" style="max-height:70vh;object-fit:cover;" alt="">
      </div>
    `);
    animateProgress();
  }

  function animateProgress() {
    clearInterval(progressTimer);
    let p = 0;
    $("#storyProgressBar").css("width", "0%");
    progressTimer = setInterval(() => {
      p += 2;
      $("#storyProgressBar").css("width", `${p}%`);
      if (p >= 100) clearInterval(progressTimer);
    }, 100);
  }

  function scheduleNext() {
    clearTimeout(timer);
    timer = setTimeout(() => {
      idx += 1;
      if (idx >= list.length) {
        bootstrap.Modal.getOrCreateInstance(document.getElementById("storyViewerModal")).hide();
        return;
      }
      renderViewer();
      scheduleNext();
    }, 5000);
  }

  $(document).on("hidden.bs.modal", "#storyViewerModal", () => {
    clearTimeout(timer);
    clearInterval(progressTimer);
  });

  return { renderRow, bindRowEvents };
})();
