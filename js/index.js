// 🔽 ① データ読み込み＆初期描画
let songs = [];  //songs.jsonの内容をsongsに格納
let lyricsMap = {}; //歌詞をlyricmapに格納
let visibleSongs = []; // ✅ 現在表示中の曲リスト（検索 or 全体）
let currentSort = "kana"; // 初期並び順（50音順）
let isDescending = true;  // 初期は降順
let displayMode = "grouped"; // "grouped" or "flat"


Promise.all([
  fetch("./json/songs.json").then(res => res.json())
])
.then(async ([songsData]) => {
  songs = songsData;
  visibleSongs = songs; // ✅ 初期表示は全曲
  applySort(); // 初期描画

  // 各曲の歌詞JSONを読み込む
  await Promise.all(
    songs.map(async song => {
      try {
        const res = await fetch(`./lyrics/lyrics_${song.id}.json`);
        const lyricBlocks = await res.json();
        const fullText = lyricBlocks.map(block => block.text).join("\n");
        lyricsMap[song.title] = fullText;
      } catch (err) {
        console.warn(`歌詞の読み込み失敗: ${song.title}`, err.message);
        lyricsMap[song.title] = "";
      }
    })
  );

  applySort(); // 初期描画
});

function applySort(sourceList = visibleSongs) {
  let sorted = [...sourceList];

  switch (currentSort) {
    case "artist":
      sorted.sort((a, b) =>
        isDescending
          ? b.artist.localeCompare(a.artist, "ja")
          : a.artist.localeCompare(b.artist, "ja")
      );
      break;
    case "album":
      sorted.sort((a, b) => {
    const isAEmpty = a.album === "なし";
    const isBEmpty = b.album === "なし";

    if (isAEmpty && !isBEmpty) return 1;  // Aが「なし」→後ろへ
    if (!isAEmpty && isBEmpty) return -1; // Bが「なし」→後ろへ

    return isDescending
      ? b.album.localeCompare(a.album, "ja")
      : a.album.localeCompare(b.album, "ja");
  });
      break;
    case "date":
      sorted.sort((a, b) =>
        isDescending
          ? new Date(b.releaseDate) - new Date(a.releaseDate)
          : new Date(a.releaseDate) - new Date(b.releaseDate)
      );
      break;
    case "kana":
      sorted.sort((a, b) => {
        const aYomi = a.yomi || "";
        const bYomi = b.yomi || "";
        return isDescending
          ? bYomi.localeCompare(aYomi, "ja")
          : aYomi.localeCompare(bYomi, "ja");
      });
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

  // ✅ 並び順に応じてグループ化
  const grouped = groupByKey(list, currentSort);

  // 🔤 見出し＋カード群を描画
  Object.keys(grouped)
    .sort((a, b) => {
    if (a === "その他") return 1;
    if (b === "その他") return -1;
    return a.localeCompare(b, "ja");
  })
  .forEach(initial => {
    const section = document.createElement("div");
    section.className = "kana-section";
    section.innerHTML = `<h2 class="kana-heading">${initial}</h2>`;

    const cardGroup = document.createElement("div");
    cardGroup.className = "card-group";

    grouped[initial].forEach(song => {
      const title = highlight(song.title, keyword);
      const card = document.createElement("a");
      card.className = "card";
      card.href = `./html/lyrics.html?id=${song.id}`;
      card.dataset.title = song.title;
      card.innerHTML = `
        <img src="./images/song-${song.id}.webp" alt="${song.title}">
        <p>${title}</p>
      `;
      cardGroup.appendChild(card);
  });

  section.appendChild(cardGroup);
  container.appendChild(section);
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

  visibleSongs = filtered; // ✅ 現在表示中の曲リストを更新
  currentSort = "kana"; // ✅ 検索時は読み順でグループ化
  applySort(); // ✅ 並び順に従ってグループ化表示される
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
  currentSort = "kana";      // ✅ 初期並び順（発表日順）
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

    applySort(); // ✅ 並び替え実行
    updateSortButtonStyles(); // ✅ ボタンの見た目更新
  });
});


function groupByKey(list, key) {
  const grouped = {};
  list.forEach(song => {
    let groupLabel = "";

    switch (key) {
      case "date":
        groupLabel = new Date(song.releaseDate).getFullYear() + "年";
        break;
      case "album":
        groupLabel = song.album || "未分類";
        break;
      case "artist":
        groupLabel = song.artist || "不明";
        break;
      case "kana":
        const firstChar = (song.yomi || song.title || "").charAt(0);
        const isJapaneseKana = /^[\u3041-\u3096]$/.test(firstChar); // ひらがな判定
        groupLabel = isJapaneseKana ? firstChar : "その他";
        break;
    }

    if (!groupLabel) return; // 空ラベルはスキップ

    if (!grouped[groupLabel]) grouped[groupLabel] = [];
    grouped[groupLabel].push(song);
  });

  return grouped;
}
