// LINVO core config
const PARENT_PIN = "6347";
const YT_API_KEY = "AIzaSyARsCgAHB2vh_L1ulVBP3-w2BwRuxibjdA"; // you'll replace later
const STORAGE_KEY = "linvo_state_v1";

// ----- Shared state helpers -----
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn("LINVO: Failed to parse saved state", e);
  }

  // default state
  const defaultState = {
    kids: [
      {
        id: "kid-1",
        name: "Alex",
        initial: "A",
      },
    ],
    currentKidId: "kid-1",
    channels: [], // {id, channelId, title, thumbnail, kidId}
    videos: [], // {id, title, channelTitle, thumbnail, kidId}
    settings: {
      dailyLimitMinutes: null,
      downtimeStart: "",
      downtimeEnd: "",
    },
  };
  return defaultState;
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn("LINVO: Failed to save state", e);
  }
}

function getCurrentKid(state) {
  return (
    state.kids.find((k) => k.id === state.currentKidId) ||
    state.kids[0] ||
    null
  );
}

// ----- Kid page: build UI -----
function initKidPage() {
  const state = loadState();
  const kid = getCurrentKid(state);

  const nowPlayingSection = document.querySelector(".now-playing");
  const playerFrame = document.getElementById("linvo-player");
  const playerTitle = document.getElementById("player-title");
  const playerChannel = document.getElementById("player-channel");
  const kidNameEl = document.getElementById("kid-name");
  const kidAvatarEl = document.getElementById("kid-avatar");
  const suggestedRow = document.getElementById("suggested-videos-row");
  const recentRow = document.getElementById("recently-watched-row");
  const channelRow = document.getElementById("kid-channels-row");

  if (kid && kidNameEl && kidAvatarEl) {
    kidNameEl.textContent = kid.name;
    kidAvatarEl.textContent = (kid.initial || kid.name[0] || "A").toUpperCase();
  }

  // Build channels row from approved channels if any
  if (channelRow && state.channels.length) {
    channelRow.innerHTML = "";
    const kidChannels = state.channels.filter(
      (c) => !kid || c.kidId === kid.id
    );
    kidChannels.forEach((ch) => {
      const card = document.createElement("article");
      card.className = "channel-card";

      const icon = document.createElement("div");
      icon.className = "channel-icon channel-icon--ted";
      icon.textContent =
        (ch.title && ch.title[0] && ch.title[1]
          ? ch.title[0] + ch.title[1]
          : "CH"
        ).toUpperCase();

      const name = document.createElement("div");
      name.className = "channel-name";
      name.textContent = ch.title || ch.channelId;

      card.appendChild(icon);
      card.appendChild(name);
      channelRow.appendChild(card);
    });
  }

  // Build suggested videos from state if any exist
  if (suggestedRow && state.videos.length) {
    suggestedRow.innerHTML = "";
    const videosForKid = state.videos.filter(
      (v) => !kid || v.kidId === kid.id
    );
    videosForKid.forEach((v) => {
      const article = document.createElement("article");
      article.className = "video-card";
      article.dataset.videoId = v.id;
      article.dataset.title = v.title;
      article.dataset.channel = v.channelTitle;

      const thumb = document.createElement("div");
      thumb.className = "video-thumb video-thumb--science";
      if (v.thumbnail) {
        thumb.style.backgroundImage = `url(${v.thumbnail})`;
        thumb.style.backgroundSize = "cover";
        thumb.style.backgroundPosition = "center";
      }

      const duration = document.createElement("span");
      duration.className = "video-duration";
      duration.textContent = v.duration || "";

      thumb.appendChild(duration);

      const titleEl = document.createElement("h3");
      titleEl.className = "video-title";
      titleEl.textContent = v.title;

      const meta = document.createElement("p");
      meta.className = "video-meta";
      meta.textContent = v.channelTitle;

      article.appendChild(thumb);
      article.appendChild(titleEl);
      article.appendChild(meta);

      suggestedRow.appendChild(article);
    });
  }

  // Build recently watched from state (simple: same as videos for now)
  if (recentRow && state.videos.length) {
    recentRow.innerHTML = "";
    const videosForKid = state.videos.filter(
      (v) => !kid || v.kidId === kid.id
    );
    videosForKid.slice(0, 8).forEach((v) => {
      const article = document.createElement("article");
      article.className = "video-card";
      article.dataset.videoId = v.id;
      article.dataset.title = v.title;
      article.dataset.channel = v.channelTitle;

      const thumb = document.createElement("div");
      thumb.className = "video-thumb video-thumb--space";
      if (v.thumbnail) {
        thumb.style.backgroundImage = `url(${v.thumbnail})`;
        thumb.style.backgroundSize = "cover";
        thumb.style.backgroundPosition = "center";
      }

      const duration = document.createElement("span");
      duration.className = "video-duration";
      duration.textContent = v.duration || "";

      thumb.appendChild(duration);

      const titleEl = document.createElement("h3");
      titleEl.className = "video-title";
      titleEl.textContent = v.title;

      const meta = document.createElement("p");
      meta.className = "video-meta";
      meta.textContent = v.channelTitle;

      article.appendChild(thumb);
      article.appendChild(titleEl);
      article.appendChild(meta);

      recentRow.appendChild(article);
    });
  }

  // Attach click handlers for all .video-card on the page
  const videoCards = document.querySelectorAll(".video-card");

  if (!nowPlayingSection || !playerFrame || !playerTitle || !playerChannel) {
    console.warn("LINVO: Player or Now Playing section not found.");
    return;
  }

  if (!videoCards.length) {
    console.warn("LINVO: No video cards found.");
    return;
  }

  let hasShownPlayer = false;

  videoCards.forEach((card) => {
    card.addEventListener("click", () => {
      const videoId = card.getAttribute("data-video-id");
      const title = card.getAttribute("data-title");
      const channel = card.getAttribute("data-channel");

      if (!videoId) return;

      // On first click, reveal the Now Playing section
      if (!hasShownPlayer) {
        nowPlayingSection.classList.remove("is-hidden");
        hasShownPlayer = true;
      }

      // Update iframe src with safe YouTube embed params
      const newSrc = `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;
      playerFrame.src = newSrc;

      if (title) playerTitle.textContent = title;
      if (channel) playerChannel.textContent = channel;

      // Add to "recently watched" in state
      const existing = state.videos.find((v) => v.id === videoId);
      if (!existing) {
        state.videos.unshift({
          id: videoId,
          title: title || "",
          channelTitle: channel || "",
          thumbnail: "",
          kidId: kid ? kid.id : null,
        });
        // keep list from growing forever
        if (state.videos.length > 50) state.videos.length = 50;
        saveState(state);
      }
    });
  });

  console.log(
    "LINVO kid page ready (player hidden until a video is selected)."
  );
}

// ----- Parent PIN modal / long-press on logo -----
function initParentPinGate() {
  const logo = document.querySelector(".logo");
  const pinOverlay = document.querySelector(".pin-overlay");
  const pinInput = document.querySelector(".pin-input");
  const pinCancelBtn = document.querySelector(".pin-btn-cancel");
  const pinConfirmBtn = document.querySelector(".pin-btn-confirm");
  const pinError = document.querySelector(".pin-error");

  if (!logo || !pinOverlay || !pinInput || !pinCancelBtn || !pinConfirmBtn) {
    return;
  }

  let pressTimer = null;

  function showPinModal() {
    pinOverlay.classList.remove("pin-hidden");
    pinOverlay.setAttribute("aria-hidden", "false");
    pinError.textContent = "";
    pinInput.value = "";
    pinInput.focus();
  }

  function hidePinModal() {
    pinOverlay.classList.add("pin-hidden");
    pinOverlay.setAttribute("aria-hidden", "true");
    pinError.textContent = "";
  }

  function handleUnlock() {
    const value = (pinInput.value || "").trim();
    if (value === PARENT_PIN) {
      window.location.href = "parent.html";
    } else {
      pinError.textContent = "Incorrect PIN. Try again.";
      pinInput.value = "";
      pinInput.focus();
    }
  }

  const startPress = () => {
    pressTimer = window.setTimeout(() => {
      showPinModal();
    }, 1000); // 1 second long-press
  };

  const cancelPress = () => {
    if (pressTimer !== null) {
      clearTimeout(pressTimer);
      pressTimer = null;
    }
  };

  // Mouse events
  logo.addEventListener("mousedown", startPress);
  logo.addEventListener("mouseup", cancelPress);
  logo.addEventListener("mouseleave", cancelPress);

  // Touch events (for tablet / phone)
  logo.addEventListener("touchstart", (e) => {
    e.preventDefault();
    startPress();
  });
  logo.addEventListener("touchend", cancelPress);
  logo.addEventListener("touchcancel", cancelPress);

  pinCancelBtn.addEventListener("click", hidePinModal);
  pinConfirmBtn.addEventListener("click", handleUnlock);

  pinInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      handleUnlock();
    }
  });
}

// ----- Parent dashboard logic -----
function renderParentKids(state) {
  const container = document.getElementById("parent-kids-list");
  if (!container) return;

  container.innerHTML = "";

  if (!state.kids.length) {
    const p = document.createElement("p");
    p.className = "hero-subtitle";
    p.textContent = "No kids added yet. Add a kid to get started.";
    container.appendChild(p);
    return;
  }

  state.kids.forEach((kid) => {
    const card = document.createElement("article");
    card.className = "video-card";

    const thumb = document.createElement("div");
    thumb.className = "video-thumb video-thumb--space";

    const title = document.createElement("h3");
    title.className = "video-title";
    title.textContent = kid.name;

    const meta = document.createElement("p");
    meta.className = "video-meta";
    const kidVideos = state.videos.filter((v) => v.kidId === kid.id);
    meta.textContent = `Videos imported: ${kidVideos.length}`;

    card.appendChild(thumb);
    card.appendChild(title);
    card.appendChild(meta);
    container.appendChild(card);
  });
}

function renderParentChannels(state) {
  const container = document.getElementById("parent-channels-list");
  if (!container) return;

  container.innerHTML = "";

  if (!state.channels.length) {
    const p = document.createElement("p");
    p.className = "hero-subtitle";
    p.textContent =
      "No approved channels yet. Add a channel to start importing videos.";
    container.appendChild(p);
    return;
  }

  state.channels.forEach((ch) => {
    const card = document.createElement("article");
    card.className = "channel-card";

    const icon = document.createElement("div");
    icon.className = "channel-icon channel-icon--ted";
    icon.textContent =
      (ch.title && ch.title[0] && ch.title[1]
        ? ch.title[0] + ch.title[1]
        : "CH"
      ).toUpperCase();

    const name = document.createElement("div");
    name.className = "channel-name";
    name.textContent = ch.title || ch.channelId;

    const meta = document.createElement("div");
    meta.className = "video-meta";
    meta.style.fontSize = "11px";
    meta.textContent = `Channel ID: ${ch.channelId}`;

    card.appendChild(icon);
    card.appendChild(name);
    card.appendChild(meta);
    container.appendChild(card);
  });
}

function renderSettings(state) {
  const dailyInput = document.getElementById("daily-limit-input");
  const startInput = document.getElementById("downtime-start-input");
  const endInput = document.getElementById("downtime-end-input");
  if (!dailyInput || !startInput || !endInput) return;

  if (state.settings.dailyLimitMinutes != null) {
    dailyInput.value = state.settings.dailyLimitMinutes;
  }
  if (state.settings.downtimeStart) {
    startInput.value = state.settings.downtimeStart;
  }
  if (state.settings.downtimeEnd) {
    endInput.value = state.settings.downtimeEnd;
  }

  dailyInput.addEventListener("change", () => {
    const v = parseInt(dailyInput.value, 10);
    state.settings.dailyLimitMinutes = isNaN(v) ? null : v;
    saveState(state);
  });

  startInput.addEventListener("change", () => {
    state.settings.downtimeStart = startInput.value || "";
    saveState(state);
  });

  endInput.addEventListener("change", () => {
    state.settings.downtimeEnd = endInput.value || "";
    saveState(state);
  });
}

function populateKidSelect(state) {
  const select = document.getElementById("channel-kid-select");
  if (!select) return;
  select.innerHTML = "";
  state.kids.forEach((kid) => {
    const opt = document.createElement("option");
    opt.value = kid.id;
    opt.textContent = kid.name;
    select.appendChild(opt);
  });
}

function parseChannelId(input) {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Channel URL formats (rough parsing)
  // https://www.youtube.com/channel/UCxxxx
  // https://www.youtube.com/@handle
  try {
    if (trimmed.startsWith("http")) {
      const url = new URL(trimmed);
      if (url.pathname.startsWith("/channel/")) {
        return url.pathname.replace("/channel/", "").replace("/", "");
      }
      if (url.pathname.startsWith("/@")) {
        // For handles, we can use "forHandle" later, but here we just return the handle
        return url.pathname.replace("/", ""); // e.g. @teded
      }
    }
  } catch (e) {
    // not a URL, fall through
  }

  return trimmed;
}

async function fetchChannelInfo(channelIdentifier) {
  // For handles (start with @), we use "forHandle" endpoint
  if (channelIdentifier.startsWith("@")) {
    const url = `https://www.googleapis.com/youtube/v3/channels?part=snippet&forHandle=${encodeURIComponent(
      channelIdentifier
    )}&key=${YT_API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch channel info");
    const data = await res.json();
    if (!data.items || !data.items.length) {
      throw new Error("Channel not found for handle");
    }
    const ch = data.items[0];
    return {
      channelId: ch.id,
      title: ch.snippet.title,
      thumbnail: ch.snippet.thumbnails?.default?.url || "",
    };
  }

  // Otherwise treat as channelId
  const url = `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${encodeURIComponent(
    channelIdentifier
  )}&key=${YT_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch channel info");
  const data = await res.json();
  if (!data.items || !data.items.length) {
    throw new Error("Channel not found");
  }
  const ch = data.items[0];
  return {
    channelId: ch.id,
    title: ch.snippet.title,
    thumbnail: ch.snippet.thumbnails?.default?.url || "",
  };
}

async function fetchLatestVideosForChannel(channelId, kidId) {
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${encodeURIComponent(
    channelId
  )}&order=date&type=video&maxResults=8&key=${YT_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch videos");
  const data = await res.json();
  if (!data.items) return [];

  return data.items.map((item) => ({
    id: item.id.videoId,
    title: item.snippet.title,
    channelTitle: item.snippet.channelTitle,
    thumbnail: item.snippet.thumbnails?.medium?.url || "",
    kidId,
  }));
}

function initParentPage() {
  const state = loadState();

  renderParentKids(state);
  renderParentChannels(state);
  renderSettings(state);
  populateKidSelect(state);

  // Add kid modal logic
  const addKidBtn = document.getElementById("add-kid-btn");
  const addKidModal = document.getElementById("add-kid-modal");
  const kidNameInput = document.getElementById("kid-name-input");
  const kidModalError = document.getElementById("kid-modal-error");
  const saveKidBtn = document.getElementById("save-kid-btn");
  const closeKidButtons = document.querySelectorAll("[data-close-kid]");

  function openKidModal() {
    if (!addKidModal) return;
    addKidModal.classList.remove("modal-hidden");
    addKidModal.setAttribute("aria-hidden", "false");
    kidModalError.textContent = "";
    kidNameInput.value = "";
    kidNameInput.focus();
  }

  function closeKidModal() {
    if (!addKidModal) return;
    addKidModal.classList.add("modal-hidden");
    addKidModal.setAttribute("aria-hidden", "true");
  }

  if (addKidBtn) {
    addKidBtn.addEventListener("click", openKidModal);
  }
  closeKidButtons.forEach((btn) =>
    btn.addEventListener("click", closeKidModal)
  );

  if (saveKidBtn && kidNameInput) {
    saveKidBtn.addEventListener("click", () => {
      const name = kidNameInput.value.trim();
      if (!name) {
        kidModalError.textContent = "Please enter a name.";
        return;
      }
      const id = `kid-${Date.now()}`;
      const initial = name[0].toUpperCase();
      state.kids.push({ id, name, initial });
      if (!state.currentKidId) state.currentKidId = id;
      saveState(state);
      renderParentKids(state);
      populateKidSelect(state);
      closeKidModal();
    });
  }

  // Add channel modal logic
  const addChannelBtn = document.getElementById("add-channel-btn");
  const addChannelModal = document.getElementById("add-channel-modal");
  const channelKidSelect = document.getElementById("channel-kid-select");
  const channelInput = document.getElementById("channel-input");
  const channelModalError = document.getElementById("channel-modal-error");
  const saveChannelBtn = document.getElementById("save-channel-btn");
  const closeChannelButtons = document.querySelectorAll("[data-close-channel]");

  function openChannelModal() {
    if (!addChannelModal) return;
    if (!state.kids.length) {
      alert("Please add a kid first.");
      return;
    }
    populateKidSelect(state);
    addChannelModal.classList.remove("modal-hidden");
    addChannelModal.setAttribute("aria-hidden", "false");
    channelModalError.textContent = "";
    channelInput.value = "";
    channelInput.focus();
  }

  function closeChannelModal() {
    if (!addChannelModal) return;
    addChannelModal.classList.add("modal-hidden");
    addChannelModal.setAttribute("aria-hidden", "true");
  }

  if (addChannelBtn) {
    addChannelBtn.addEventListener("click", openChannelModal);
  }
  closeChannelButtons.forEach((btn) =>
    btn.addEventListener("click", closeChannelModal)
  );

  if (saveChannelBtn && channelInput && channelKidSelect) {
    saveChannelBtn.addEventListener("click", async () => {
      const raw = channelInput.value;
      const kidId = channelKidSelect.value;
      if (!raw.trim()) {
        channelModalError.textContent = "Please enter a channel URL or ID.";
        return;
      }
      channelModalError.textContent = "Checking channel…";
      try {
        const identifier = parseChannelId(raw);
        if (!identifier) {
          channelModalError.textContent = "Could not read that channel.";
          return;
        }
        const info = await fetchChannelInfo(identifier);

        const channelRecord = {
          id: `ch-${Date.now()}`,
          channelId: info.channelId,
          title: info.title,
          thumbnail: info.thumbnail,
          kidId,
        };
        state.channels.push(channelRecord);

        channelModalError.textContent = "Importing latest videos…";
        const videos = await fetchLatestVideosForChannel(info.channelId, kidId);
        // Add or update videos (avoid duplicates)
        videos.forEach((v) => {
          if (!state.videos.find((existing) => existing.id === v.id)) {
            state.videos.push(v);
          }
        });

        saveState(state);
        renderParentChannels(state);
        renderParentKids(state);
        channelModalError.textContent = "";
        closeChannelModal();
      } catch (e) {
        console.error(e);
        channelModalError.textContent =
          "Could not import channel. Check the URL/ID or try again.";
      }
    });
  }

  console.log("LINVO parent dashboard ready.");
}

// ----- Entry point -----
document.addEventListener("DOMContentLoaded", () => {
  const page = document.body.dataset.page || "kid";

  if (page === "kid") {
    initKidPage();
    initParentPinGate();
  } else if (page === "parent") {
    initParentPage();
  }
});
