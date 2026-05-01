window.AuthPage = (() => {
  function render() {
    $("#appContent").html(`
      <div class="row justify-content-center align-items-center" style="min-height:calc(100vh - 120px);">
        <div class="col-12 col-md-6 col-lg-5">
          <div class="surface-card p-4">
            <div class="text-center mb-3">
              <i class="fa-brands fa-facebook fs-1 app-logo"></i>
              <h4 class="mt-2 mb-0">FaceSpace</h4>
              <small class="text-secondary">Connect with your people.</small>
            </div>
            <ul class="nav nav-pills nav-fill mb-3">
              <li class="nav-item"><button class="nav-link active" id="showLogin">Login</button></li>
              <li class="nav-item"><button class="nav-link" id="showRegister">Register</button></li>
            </ul>
            <div id="authPane"></div>
          </div>
        </div>
      </div>
    `);
    bind();
    renderLogin();
  }

  function bind() {
    $(document).off("click", "#showLogin").on("click", "#showLogin", () => {
      $("#showLogin").addClass("active"); $("#showRegister").removeClass("active"); renderLogin();
    });
    $(document).off("click", "#showRegister").on("click", "#showRegister", () => {
      $("#showRegister").addClass("active"); $("#showLogin").removeClass("active"); renderRegister();
    });
  }

  function renderLogin() {
    $("#authPane").html(`
      <form id="loginForm" novalidate>
        <div class="mb-2">
          <label class="form-label">Email</label>
          <input class="form-control" name="email" value="liam@demo.com">
          <div class="invalid-feedback" data-err="email"></div>
        </div>
        <div class="mb-2">
          <label class="form-label">Password</label>
          <input type="password" class="form-control" name="password" value="123456">
          <div class="invalid-feedback" data-err="password"></div>
        </div>
        <button class="btn btn-primary w-100 mt-2">Login</button>
      </form>
    `);
    $(document).off("submit", "#loginForm").on("submit", "#loginForm", onLogin);
  }

  function renderRegister() {
    $("#authPane").html(`
      <form id="registerForm" novalidate>
        <div class="mb-2">
          <label class="form-label">Full Name</label>
          <input class="form-control" name="name">
          <div class="invalid-feedback" data-err="name"></div>
        </div>
        <div class="mb-2">
          <label class="form-label">Email</label>
          <input class="form-control" name="email">
          <div class="invalid-feedback" data-err="email"></div>
        </div>
        <div class="mb-2">
          <label class="form-label">Password</label>
          <input type="password" class="form-control" name="password">
          <div class="invalid-feedback" data-err="password"></div>
        </div>
        <div class="mb-2">
          <label class="form-label">Confirm Password</label>
          <input type="password" class="form-control" name="confirmPassword">
          <div class="invalid-feedback" data-err="confirmPassword"></div>
        </div>
        <button class="btn btn-primary w-100 mt-2">Create Account</button>
      </form>
    `);
    $(document).off("submit", "#registerForm").on("submit", "#registerForm", onRegister);
  }

  function showError(form, name, msg) {
    form.find(`[name="${name}"]`).addClass("is-invalid");
    form.find(`[data-err="${name}"]`).text(msg);
  }

  function clearErrors(form) {
    form.find(".is-invalid").removeClass("is-invalid");
    form.find(".invalid-feedback").text("");
  }

  function onLogin(e) {
    e.preventDefault();
    const form = $(e.currentTarget);
    clearErrors(form);
    const email = form.find("[name='email']").val().trim();
    const password = form.find("[name='password']").val().trim();
    let valid = true;
    if (!email.includes("@")) { showError(form, "email", "Enter a valid email."); valid = false; }
    if (!password) { showError(form, "password", "Password is required."); valid = false; }
    if (!valid) return;

    const user = StorageService.allUsers().find((u) => u.email === email && u.password === password);
    if (!user) {
      showError(form, "password", "Invalid email/password.");
      return;
    }
    StorageService.setCurrentUser(user);
    App.toast("Welcome back, " + user.name, "success");
    App.routeTo("feed");
  }

  function onRegister(e) {
    e.preventDefault();
    const form = $(e.currentTarget);
    clearErrors(form);
    const name = form.find("[name='name']").val().trim();
    const email = form.find("[name='email']").val().trim();
    const password = form.find("[name='password']").val().trim();
    const confirmPassword = form.find("[name='confirmPassword']").val().trim();
    let valid = true;

    if (name.length < 3) { showError(form, "name", "Name must be at least 3 characters."); valid = false; }
    if (!email.includes("@")) { showError(form, "email", "Enter a valid email."); valid = false; }
    if (password.length < 6) { showError(form, "password", "Password must be at least 6 characters."); valid = false; }
    if (confirmPassword !== password) { showError(form, "confirmPassword", "Passwords do not match."); valid = false; }
    if (!valid) return;

    const users = StorageService.allUsers();
    if (users.some((u) => u.email === email)) {
      showError(form, "email", "Email already registered.");
      return;
    }

    const newUser = {
      id: StorageService.id("u"),
      name,
      email,
      password,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1877F2&color=fff`,
      bio: "New to FaceSpace",
      coverPhoto: "https://picsum.photos/1200/360?random=900"
    };
    users.push(newUser);
    StorageService.setUsers(users);
    StorageService.setCurrentUser(newUser);
    const friends = StorageService.friendsMap(); friends[newUser.id] = []; StorageService.setFriendsMap(friends);
    const requests = StorageService.friendRequestsMap(); requests[newUser.id] = []; StorageService.setFriendRequestsMap(requests);
    App.toast("Account created successfully", "success");
    App.routeTo("feed");
  }

  return { render };
})();
