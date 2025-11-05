// グローバル変数に曲一覧を保持（検索・並び替え用）
let songs = [];
let lyricsMap = {};
let currentSort = "date";
let isDescending = true;

Promise.all([
  fetch("./json/songs.json").then(res => res.json())
])
.then(async ([songsData]) => {
  songs = songsData;

  // 各曲の歌詞JSONを読み込む
  await Promise.all(
    songs.map(async song => {
      try {
        const res = await fetch(`./lyrics/lyrics_${song.id}.json`);
        const lyricBlocks = await res.json();
        const fullText = lyricBlocks.map(block => block.text).join("\n");
        lyricsMap[song.title] = fullText;
      } catch (err) {
        console.warn(`歌詞の読み込み失敗: ${song.title}`, err);
        lyricsMap[song.title] = "";
      }
    })
  );

  applySort(); // 初期描画
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
    // 他の並び順もここに続く
  }

  renderCards(sorted);
}

function updateSortButtonStyles() {
  document.querySelectorAll(".sort-btn").forEach(button => {
    button.classList.remove("active");
    if (button.dataset.sort === currentSort) {
      button.classList.add("active");
    }
  });
}

// 🔽 ② カード描画関数（検索(ハイライト、結果０件表示つき)・並び替えでも使う）
function renderCards(list) {
  const container = document.querySelector(".card-container");
  const noResults = document.getElementById("no-results-message");
  const keyword = document.getElementById("search-input").value.toLowerCase();

  container.innerHTML = "";

  if (list.length === 0) {
    noResults.style.display = "block";
    return;
  } else {
    noResults.style.display = "none";
  }

  list.forEach(song => {
    const title = highlight(song.title, keyword);

    const card = document.createElement("a");
    card.className = "card";
    card.href = `./html/lyrics.html?id=${song.id}`;
    card.dataset.title = song.title;

    card.innerHTML = `
      <img src="./images/song-${song.id}.webp" alt="${song.title}">
      <p>${title}</p>
    `;

    container.appendChild(card);
  });
}

// 🔽 ③ 検索機能（検索ボックスの入力に応じて絞り込み）
document.getElementById("search-input").addEventListener("input", function () {
  const keyword = this.value.toLowerCase();
  showSearchHistory(); // ✅ 履歴表示だけ更新（保存はしない）

  const filtered = songs.filter(song => {
    const lyricsText = String(lyricsMap[song.title] || "").toLowerCase();
    return (
      song.title.toLowerCase().includes(keyword) ||
      song.artist.toLowerCase().includes(keyword) ||
      song.album.toLowerCase().includes(keyword) ||
      lyricsText.includes(keyword)
    );
  });

  renderCards(filtered);
});

document.getElementById("search-button").addEventListener("click", () => {
  const keyword = document.getElementById("search-input").value.toLowerCase().trim();
  if (!keyword) return;

  saveSearchHistory(keyword);   // ✅ このタイミングで履歴に追加
  showSearchHistory();          // ✅ 履歴表示を更新

  const filtered = songs.filter(song => {
    const lyricsText = String(lyricsMap[song.title] || "").toLowerCase();
    return (
      song.title.toLowerCase().includes(keyword) ||
      song.artist.toLowerCase().includes(keyword) ||
      song.album.toLowerCase().includes(keyword) ||
      lyricsText.includes(keyword)
    );
  });

   renderCards(filtered);
});


const input = document.getElementById("search-input");
const historyBox = document.getElementById("search-history");

input.addEventListener("focus", () => {
  showSearchHistory();           // ✅ 履歴を更新
  historyBox.style.display = "block"; // ✅ 表示
});

input.addEventListener("blur", () => {
  setTimeout(() => {
    historyBox.style.display = "none"; // ✅ 非表示（クリック猶予あり）
  }, 150);
});

//検索語のハイライト機能
function highlight(text, keyword) {
  if (!keyword) return text;
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(escaped, "gi");
  return text.replace(regex, match => `<mark>${match}</mark>`);
}

//検索履歴保存機能
function saveSearchHistory(keyword) {
  if (!keyword) return;
  let history = JSON.parse(localStorage.getItem("searchHistory") || "[]");
  keyword = keyword.trim().toLowerCase();
  if (!history.includes(keyword)) {
    history.unshift(keyword);
    if (history.length > 5) history.pop(); // 最大10件
    localStorage.setItem("searchHistory", JSON.stringify(history));
  }
}

//検索履歴表示
function showSearchHistory() {
  const history = JSON.parse(localStorage.getItem("searchHistory") || "[]");
  const container = document.getElementById("search-history");
  container.innerHTML = "";

  if (history.length === 0) return;

  history.forEach(word => {
    const btn = document.createElement("button");
    btn.textContent = word;
    btn.className = "history-btn";
    btn.addEventListener("click", () => {
      const input = document.getElementById("search-input");
      input.value = word;
      input.dispatchEvent(new Event("input"));
      container.style.display = "none"; // ✅ 履歴を閉じる
    });
    container.appendChild(btn);
  });
}

window.addEventListener("DOMContentLoaded", () => {
  showSearchHistory();
});

// 🔽 ④ タイトルクリックでリセット
document.getElementById("reset-button").addEventListener("click", () => {
  // 検索欄を空に
  const searchBox = document.getElementById("search-input");
  if (searchBox) searchBox.value = "";

  // 並び替え状態を初期化
  currentSort = "date";      // ✅ 初期並び順（発表日順）
  isDescending = true;

  // ボタンの選択状態も更新
  updateSortButtonStyles();

  // 再描画
  applySort();
});

// 🔽 ④ 並び替え機能（ボタンから呼び出す）

document.querySelectorAll(".sort-btn").forEach(button => {
  button.addEventListener("click", () => {
    const selectedSort = button.dataset.sort;

    // 同じボタンをもう一度押したら昇降を反転
    if (currentSort === selectedSort) {
      isDescending = !isDescending;
    } else {
      currentSort = selectedSort;
      isDescending = false; // 初回は昇順
    }

    applySort();
    updateSortButtonStyles();
  });
});

function applySort() {
  let sorted = [...songs];

  switch (currentSort) {
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
          ? b.artist.localeCompare(a.artist, "ja")
          : a.artist.localeCompare(b.artist, "ja")
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
    case "date":
      sorted.sort((a, b) =>
        isDescending
          ? new Date(b.releaseDate) - new Date(a.releaseDate)
          : new Date(a.releaseDate) - new Date(b.releaseDate)
      );
      break;
  }

  renderCards(sorted);
}

function updateSortButtonStyles() {
  document.querySelectorAll(".sort-btn").forEach(button => {
    button.classList.remove("active");
    if (button.dataset.sort === currentSort) {
      button.classList.add("active");
    }
  });
}
