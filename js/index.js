let songs = [];

// 🔽 ① JSON読み込み＋初期描画
fetch("../songs.json")
  .then(res => res.json())
  .then(data => {
    songs = data;
  
　　// 🔽 発売日の新しい順に並び替え
    songs.sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate));

    renderCards(songs);

  })
  .catch(err => {
    console.error("songs.jsonの読み込みに失敗しました:", err);
  });

// 🔽 ② カード描画関数（検索・並び替えでも使う）
function renderCards(list) {
  const container = document.querySelector(".card-container");
  container.innerHTML = "";

  list.forEach(song => {
    const card = document.createElement("a");
    card.className = "card";
    card.href = song.link;
    card.dataset.title = song.title;

    card.innerHTML = `
      <img src="${song.image}" alt="${song.title}">
      <p>${song.title}</p>
    `;

    container.appendChild(card);
  });
}

// 🔽 ③ 検索機能（検索ボックスの入力に応じて絞り込み）
document.getElementById("searchBox").addEventListener("input", function () {
  const keyword = this.value.toLowerCase();
  const filtered = songs.filter(song =>
    song.title.toLowerCase().includes(keyword)
  );
  renderCards(filtered);
});

// 🔽 ④ ここに追加！タイトルクリックでリセット
document.getElementById("siteTitle").addEventListener("click", () => {
  const searchBox = document.getElementById("searchBox");
  if (searchBox) searchBox.value = "";
  renderCards(songs); // 初期状態に戻す
});

// 🔽 ④ 並び替え機能（ボタンから呼び出す）
function sortByTitle() {
  const sorted = [...songs].sort((a, b) =>
    a.title.localeCompare(b.title, "ja")
  );
  renderCards(sorted);
}

function sortByAlbum() {
  const sorted = [...songs].sort((a, b) => {
    const albumA = a.album === "なし" ? "～～～" : a.album;
    const albumB = b.album === "なし" ? "～～～" : b.album;
    return albumA.localeCompare(albumB);
  });
  renderCards(sorted);
}

function sortByArtist() {
  const sorted = [...songs].sort((a, b) => a.artist.localeCompare(b.artist));
  renderCards(sorted);
}
