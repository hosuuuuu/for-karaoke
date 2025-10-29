// URLから曲名を取得（例：lyrics/happiness.html → song = "happiness"）
const path = window.location.pathname;
const song = path.split("/").pop().replace(".html", "");

fetch(`../lyrics/${song}.json`)
  .then(res => res.json())
  .then(lyricsData => {
    const container = document.getElementById("lyrics-container");

    lyricsData.forEach((line) => {
      const lineDiv = document.createElement("div");
      lineDiv.className = "line";

      const labelGroup = document.createElement("div");
      labelGroup.className = `label-group label-${line.label.length}`;
      line.label.forEach(part => {
        const span = document.createElement("span");
        span.className = `part-label ${part}`;
        span.textContent = part;
        labelGroup.appendChild(span);
      });

      const lyricSpan = document.createElement("span");
      lyricSpan.className = "lyric-text";
      lyricSpan.innerHTML = line.text.replace(/\\n/g, "<br>");

      lineDiv.appendChild(labelGroup);
      lineDiv.appendChild(lyricSpan);
      container.appendChild(lineDiv);
    });
  })
  .catch(err => {
    console.error("JSONの読み込みに失敗しました:", err);
  });

let currentSort = "date";
let isDescending = true;

document.getElementById("sort-select").addEventListener("change", (e) => {
  currentSort = e.target.value;
  applySort();
});

document.getElementById("sort-direction").addEventListener("click", () => {
  isDescending = !isDescending;
  updateDirectionButton();
  applySort();
});

function applySort() {
  let sorted = [...songs];

  switch (currentSort) {
    case "date":
      sorted.sort((a, b) =>
        isDescending
          ? new Date(b.releaseDate) - new Date(a.releaseDate)
          : new Date(a.releaseDate) - new Date(b.releaseDate)
      );
      break;
    case "title":
      sorted.sort((a, b) =>
        isDescending
          ? b.title.localeCompare(a.title, "ja")
          : a.title.localeCompare(b.title, "ja")
      );
      break;
    case "artist":
      sorted.sort((a, b) =>
        isDescending
          ? b.artist.localeCompare(a.artist)
          : a.artist.localeCompare(b.artist)
      );
      break;
    case "album":
      sorted.sort((a, b) => {
        const albumA = a.album === "なし" ? "～～～" : a.album;
        const albumB = b.album === "なし" ? "～～～" : b.album;
        return isDescending
          ? albumB.localeCompare(albumA, "ja")
          : albumA.localeCompare(albumB, "ja");
      });
      break;
  }

  renderCards(sorted);
  updateSortStatus();
}

function updateDirectionButton() {
  const btn = document.getElementById("sort-direction");
  btn.textContent = isDescending ? "⬇️ 降順" : "⬆️ 昇順";
}

function updateSortStatus() {
  const status = document.getElementById("sort-status");
  const labels = {
    date: "発表日順",
    title: "50音順",
    artist: "アーティスト順",
    album: "アルバム順"
  };
  const direction = isDescending ? "降順" : "昇順";
  status.textContent = `🔍 並び順：${labels[currentSort]}（${direction}）`;
}