const liveId = location.pathname.split("/").pop().replace(".html", "");

Promise.all([
  fetch("../json/lives.json").then(res => res.json()),
  fetch(`../json/setlist-${liveId}.json`).then(res => res.json()),
  fetch("../json/songs.json").then(res => res.json())
])
.then(([lives, setlist, songs]) => {
  const live = lives.find(l => l.id === liveId);
  if (live) {
    document.getElementById("live-title").textContent = live["title "]?.trim() || "ライブタイトル未定";
    document.title = `${live["title "]?.trim()} - セトリ`;
  }

  const container = document.getElementById("setlist-container");

  setlist.forEach(entry => {
    const song = songs.find(s => s.id === entry.songId);
    const li = document.createElement("li");

    if (song) {
      li.innerHTML = `
        <img src="../images/song-${song.id}.webp" alt="${song.title}">
        <a href="../html/${song.id}.html">${entry.order}. ${song.title}</a>
      `;
    } else {
      li.innerHTML = `<span>${entry.order}. （未定）</span>`;
    }

    container.appendChild(li);
  });
});