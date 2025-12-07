// LINVO home screen logic
// - Now Playing is hidden by default
// - Clicking a video-card shows it and updates the player

document.addEventListener("DOMContentLoaded", () => {
  const nowPlayingSection = document.querySelector(".now-playing");
  const playerFrame = document.getElementById("linvo-player");
  const playerTitle = document.getElementById("player-title");
  const playerChannel = document.getElementById("player-channel");
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
    });
  });

  console.log("LINVO home screen ready (player hidden until a video is selected).");
});
