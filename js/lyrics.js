const id = location.pathname.split("/").pop().replace(".html", "");

// 曲情報を読み込む
fetch("../json/songs.json")
  .then(res => res.json())
  .then(songs => {
    const song = songs.find(s => s.id === id);
    if (!song) return;

    // 曲情報を埋め込む
    document.getElementById("song-title").textContent = song.title;
    document.getElementById("song-artist").textContent = `アーティスト：${song.artist}`;
    document.getElementById("song-date").textContent = `リリース日：${song.releaseDate}`;
    document.getElementById("song-album").textContent = `アルバム：${song.album}`;
    document.getElementById("song-thumbnail").src = `./images/song-${song.id}.webp`;
    document.getElementById("song-thumbnail").alt = song.title;

    // ページタイトルも更新
    document.title = `${song.title}`;
  });


fetch(`../lyrics/lyrics_${id}.json`)
  .then(res => res.json())
  .then(blocks => {
    const container = document.getElementById("lyrics-container");

    blocks.forEach(block => {
      const labelText = block["ラベル"] || "";
      const lyricsText = block["歌詞"] || "";

      // ラベルを配列に分割（例："う,し,さ" → ["う", "し", "さ"]）
      const labels = labelText.split(",").map(l => l.trim()).filter(Boolean);

      // ラベルの数に応じてクラスを付与（例：label-3）
      const labelGroupClass = `label-group label-${labels.length}`;

      // ラベルHTMLを生成
      const labelHTML = labels
        .map(label => `<span class="part-label ${label}">${label}</span>`)
        .join("");

      // 歌詞HTMLを生成（\n → <br>）
      const lyricsHTML = lyricsText.replace(/\\n/g, "<br>");

      // 全体の行を構築
      const line = document.createElement("div");
      line.className = "line";

      line.innerHTML = `
        <div class="${labelGroupClass}">
          ${labelHTML}
        </div>
        <div class="lyric-text">${lyricsHTML}</div>
      `;

      container.appendChild(line);
    });
  })
  .catch(err => {
    document.getElementById("lyrics-container").innerHTML =
      "<p>歌詞の読み込みに失敗しました。</p>";
    console.warn("歌詞読み込みエラー", err);
  });