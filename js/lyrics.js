fetch("../songs.json")
  .then(res => res.json())
  .then(data => {
    // ページ内の曲名を取得
    const currentTitle = document.querySelector(".song-title").textContent.trim();

    // JSONの中から一致する曲を探す
    const song = data.find(s => s.title === currentTitle);
    if (!song) return;

    // 曲情報を表示するエリアに書き込む
    const infoBox = document.querySelector(".song-info");
    infoBox.innerHTML = `
      <p><strong>発表日：</strong>${song.releaseDate.slice(0, 10)}</p>
      <p><strong>アーティスト：</strong>${song.artist}</p>
      <p><strong>アルバム：</strong>${song.album}</p>
    `;
  });