// LINVO home screen logic
// - Clicking a video-card updates the Now Playing player (iframe + text)

document.addEventListener("DOMContentLoaded", () => {
  const playerFrame = document.getElementById("linvo-player");
  const playerTitle = document.getElementById("player-title");
  const playerChannel = document.getElementById("player-channel");
  const videoCards = document.querySelectorAll(".video-card");

  if (!playerFrame || !playerTitle || !playerChannel) {
    console.warn("LINVO: Player elements not found.");
    return;
  }

  if (!videoCards.length) {
    console.warn("LINVO: No video cards found.");
    return;
  }

  videoCards.forEach((card) => {
    card.addEventListener("click", () => {
      const videoId = card.getAttribute("data-video-id");
      const title = card.getAttribute("data-title");
      const channel = card.getAttribute("data-channel");

      if (!videoId) return;

      // Update iframe src with safe YouTube embed params
      const newSrc = `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;
      playerFrame.src = newSrc;

      if (title) playerTitle.textContent = title;
      if (channel) playerChannel.textContent = channel;
    });
  });

  console.log("LINVO home screen ready.");
});
