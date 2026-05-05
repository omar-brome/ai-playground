window.StorageService = (() => {
  const KEYS = {
    currentUser: "currentUser",
    users: "users",
    posts: "posts",
    stories: "stories",
    friends: "friends",
    friendRequests: "friendRequests",
    notifications: "notifications",
    messages: "messages",
    savedPosts: "savedPosts",
    appTheme: "appTheme",
    appBootstrapped: "appBootstrapped"
  };

  const now = () => Date.now();
  const id = (p) => `${p}_${Math.random().toString(36).slice(2, 9)}_${Date.now()}`;

  function read(key, fallback) {
    const v = localStorage.getItem(key);
    if (!v) return fallback;
    try { return JSON.parse(v); } catch { return fallback; }
  }

  function write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function seedIfNeeded() {
    if (localStorage.getItem(KEYS.appBootstrapped)) return;

    const users = [
      { id: "u1", name: "Liam Carter", email: "liam@demo.com", password: "123456", avatar: "https://i.pravatar.cc/150?img=12", bio: "Product designer & coffee lover", coverPhoto: "https://picsum.photos/1200/360?random=31" },
      { id: "u2", name: "Sophia Patel", email: "sophia@demo.com", password: "123456", avatar: "https://i.pravatar.cc/150?img=32", bio: "Traveling and storytelling.", coverPhoto: "https://picsum.photos/1200/360?random=32" },
      { id: "u3", name: "Noah Kim", email: "noah@demo.com", password: "123456", avatar: "https://i.pravatar.cc/150?img=22", bio: "Frontend engineer. Music addict.", coverPhoto: "https://picsum.photos/1200/360?random=33" },
      { id: "u4", name: "Emma Johnson", email: "emma@demo.com", password: "123456", avatar: "https://i.pravatar.cc/150?img=5", bio: "Fitness and wellness.", coverPhoto: "https://picsum.photos/1200/360?random=34" },
      { id: "u5", name: "Ava Ibrahim", email: "ava@demo.com", password: "123456", avatar: "https://i.pravatar.cc/150?img=44", bio: "Photographer and creator.", coverPhoto: "https://picsum.photos/1200/360?random=35" }
    ];

    const sampleTexts = [
      "Morning run done. Feeling great today!",
      "Just wrapped up a new UI concept. Feedback welcome.",
      "Who else is planning a weekend trip?",
      "Learning jQuery event delegation again. Classic and useful.",
      "This sunset was unreal.",
      "New playlist is fire.",
      "Coffee + code = perfect combo.",
      "Any good movie recommendations?",
      "Minimal design challenge day 3.",
      "Sharing a quick moment from today."
    ];

    const posts = sampleTexts.map((text, i) => ({
      id: id("post"),
      userId: users[i % users.length].id,
      text,
      image: i % 2 ? `https://picsum.photos/900/520?random=${100 + i}` : "",
      feeling: i % 3 ? "" : "Happy",
      audience: ["public", "friends", "onlyme"][i % 3],
      timestamp: now() - (i + 1) * 1000 * 60 * 24,
      reactions: {},
      comments: i % 2 ? [{ id: id("c"), userId: "u3", text: "Looks great!", timestamp: now() - 1000 * 60 * 8 }] : [],
      shares: i % 4
    }));

    const stories = users.flatMap((u, idx) => ([
      { id: id("story"), userId: u.id, image: `https://picsum.photos/450/760?random=${idx * 3 + 201}`, timestamp: now() - 1000 * 60 * 30 },
      { id: id("story"), userId: u.id, image: `https://picsum.photos/450/760?random=${idx * 3 + 202}`, timestamp: now() - 1000 * 60 * 60 },
      { id: id("story"), userId: u.id, image: `https://picsum.photos/450/760?random=${idx * 3 + 203}`, timestamp: now() - 1000 * 60 * 90 }
    ]));

    const friends = {
      u1: ["u2", "u3"],
      u2: ["u1", "u4"],
      u3: ["u1", "u5"],
      u4: ["u2"],
      u5: ["u3"]
    };

    const friendRequests = {
      u1: ["u4"],
      u2: ["u5"],
      u3: [],
      u4: [],
      u5: ["u1"]
    };

    const notifications = [
      { id: id("n"), type: "like", fromUserId: "u2", postId: posts[0].id, read: false, timestamp: now() - 1000 * 60 * 5 },
      { id: id("n"), type: "comment", fromUserId: "u3", postId: posts[1].id, read: false, timestamp: now() - 1000 * 60 * 35 },
      { id: id("n"), type: "friend_request", fromUserId: "u4", postId: null, read: true, timestamp: now() - 1000 * 60 * 120 },
      { id: id("n"), type: "birthday", fromUserId: "u5", postId: null, read: true, timestamp: now() - 1000 * 60 * 260 }
    ];

    write(KEYS.users, users);
    write(KEYS.posts, posts);
    write(KEYS.stories, stories);
    write(KEYS.friends, friends);
    write(KEYS.friendRequests, friendRequests);
    write(KEYS.notifications, notifications);
    write(KEYS.messages, {});
    write(KEYS.savedPosts, []);
    write(KEYS.currentUser, users[0]);
    write(KEYS.appTheme, "light");
    localStorage.setItem(KEYS.appBootstrapped, "1");
  }

  function getCurrentUser() { return read(KEYS.currentUser, null); }
  function setCurrentUser(user) { write(KEYS.currentUser, user); }
  function clearCurrentUser() { localStorage.removeItem(KEYS.currentUser); }

  function allUsers() { return read(KEYS.users, []); }
  function setUsers(v) { write(KEYS.users, v); }
  function allPosts() { return read(KEYS.posts, []); }
  function setPosts(v) { write(KEYS.posts, v); }
  function allStories() { return read(KEYS.stories, []); }
  function setStories(v) { write(KEYS.stories, v); }
  function allNotifications() { return read(KEYS.notifications, []); }
  function setNotifications(v) { write(KEYS.notifications, v); }
  function friendsMap() { return read(KEYS.friends, {}); }
  function setFriendsMap(v) { write(KEYS.friends, v); }
  function friendRequestsMap() { return read(KEYS.friendRequests, {}); }
  function setFriendRequestsMap(v) { write(KEYS.friendRequests, v); }
  function messagesMap() { return read(KEYS.messages, {}); }
  function setMessagesMap(v) { write(KEYS.messages, v); }
  function savedPosts() { return read(KEYS.savedPosts, []); }
  function setSavedPosts(v) { write(KEYS.savedPosts, v); }
  function getTheme() { return read(KEYS.appTheme, "light"); }
  function setTheme(v) { write(KEYS.appTheme, v); }

  function userById(userId) {
    return allUsers().find((u) => u.id === userId) || null;
  }

  function timeAgo(ts) {
    const diff = Math.max(0, now() - ts);
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins} minute${mins > 1 ? "s" : ""} ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hour${hrs > 1 ? "s" : ""} ago`;
    const days = Math.floor(hrs / 24);
    return `${days} day${days > 1 ? "s" : ""} ago`;
  }

  return {
    seedIfNeeded,
    id,
    now,
    getCurrentUser,
    setCurrentUser,
    clearCurrentUser,
    allUsers,
    setUsers,
    allPosts,
    setPosts,
    allStories,
    setStories,
    allNotifications,
    setNotifications,
    friendsMap,
    setFriendsMap,
    friendRequestsMap,
    setFriendRequestsMap,
    messagesMap,
    setMessagesMap,
    savedPosts,
    setSavedPosts,
    getTheme,
    setTheme,
    userById,
    timeAgo
  };
})();
