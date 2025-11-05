//グローバル変数を追加
let currentSong = null; 
let arrowIndicator = null;

function handleClick() {
  const lines = document.querySelectorAll(".line");

  if (currentIndex < lines.length) {
    const targetLine = lines[currentIndex];
    targetLine.style.visibility = "visible";

    const labelContainer = targetLine.querySelector(".label-group");
    const lyricBox = targetLine.querySelector(".lyric-text");
    
    if (labelContainer) {
      labelContainer.style.visibility = "visible"; // ✅ ラベルを表示
      labelContainer.prepend(arrowIndicator);      // ✅ ▶を移動
      // ✅ スクロール処理を追加！
      labelContainer.scrollIntoView({
        behavior: "smooth", // なめらかにスクロール
        block: "center"     // 画面中央に配置
      });
    }

    if (lyricBox && currentMode === "blind") {
      const labelSpans = labelContainer?.querySelectorAll(".part-label") || [];
      const labels = Array.from(labelSpans).map(span => span.textContent.trim()).filter(Boolean);
      const lyricBackground = labels.map((label, i) => {
        const color = labelColors[label] || "rgba(240,240,240,0.3)";
        const start = (i / labels.length) * 100;
        const end = ((i + 1) / labels.length) * 100;
        return `${color} ${start}%, ${color} ${end}%`;
      }).join(", ");
      const gradient = `linear-gradient(to right, ${lyricBackground})`;
      lyricBox.style.background = gradient;
    }

    currentIndex++;
  }

}

// URLパラメータからIDを取得
const params = new URLSearchParams(window.location.search);
const songId = params.get("id");

//モード状態の変数
let currentMode = "default"; // "default" or "blind"
let currentIndex = 0;        // 表示中のインデックス
window.setMode = function(mode) {
  currentMode = mode;
  currentIndex = 0;
  if (currentSong) {
    loadLyrics(currentSong); // ✅ song を渡す
  } else {
    console.warn("setMode: currentSong is undefined");
  }
}


//モード切替関数
function setMode(mode) {
  currentMode = mode;
  currentIndex = 0;
  loadLyrics(currentSong); // 歌詞を再描画（下で定義）

  // ボタンの見た目を更新
  document.getElementById("defaultBtn").classList.remove("active");
  document.getElementById("blindBtn").classList.remove("active");
  if (mode === "default") {
    document.getElementById("defaultBtn").classList.add("active");
  } else {
    document.getElementById("blindBtn").classList.add("active");
  }
}

if (!songId) {
  document.getElementById("lyrics-container").innerHTML = "<p>曲IDが指定されていません。</p>";
  throw new Error("No song ID");
}

// ラベルごとの背景色設定
const labelColors = {
  "う": "rgba(194, 255, 71, 0.64)", // うらたぬき
  "し": "rgba(128, 0, 128, 0.3)", // 志麻
  "さ": "rgba(255, 0, 0, 0.3)", // 坂田
  "せ": "rgba(255, 217, 0, 0.47)", // センラ
};

// 曲情報を読み込む
fetch("../json/songs.json")
  .then(res => res.json())
  .then(songs => {
    const song = songs.find(s => s.id === songId);
    
    currentSong = song; // ✅ ここで保存
    loadLyrics(song);   // ✅ 初回読み込み


    // 曲情報を画面に表示
    document.getElementById("song-title").textContent = song.title;
    document.getElementById("song-artist").textContent = `アーティスト：${song.artist}`;
    document.getElementById("song-date").textContent = `リリース日：${song.releaseDate}`;
    document.getElementById("song-album").textContent = `アルバム：${song.album}`;
    document.getElementById("song-thumbnail").src = `../images/song-${song.id}.webp`;
    document.getElementById("song-thumbnail").alt = song.title;
    document.title = `${song.title}`;

    // ✅ 歌詞を読み込む関数を呼び出す
    loadLyrics(song);
  })
  .catch(err => {
    document.getElementById("lyrics-container").innerHTML = "<p>曲情報の読み込みに失敗しました。</p>";
    console.warn("曲情報読み込みエラー", err);
  });


    // 📄 歌詞データを読み込む
    function loadLyrics(song) {
      if (!song) {
        console.warn("loadLyrics: song is undefined");
        return;
      }

      fetch(`../lyrics/lyrics_${song.id}.json`)
        .then(res => res.json())
        .then(blocks => {
          const container = document.getElementById("lyrics-container");
          container.innerHTML = ""; // ✅ 初期化
          
          // 最大幅を計算
          let maxWidth = 0;
          blocks.forEach(block => {
            const lyricsText = block["歌詞"] || "";
            const temp = document.createElement("div");
            temp.className = "lyric-text";
            temp.style.position = "absolute";
            temp.style.visibility = "hidden";
            temp.style.whiteSpace = "pre-wrap";
            temp.innerHTML = lyricsText.replace(/\\n/g, "<br>");
            document.body.appendChild(temp);
            maxWidth = Math.max(maxWidth, temp.offsetWidth);
            document.body.removeChild(temp);
        });

        // 💡 コンテナの最大幅を設定（余白込み）
        container.style.maxWidth = `${maxWidth + 40}px`; // 余白分を追加
  
        // ✅▶マークをここで生成する！
        arrowIndicator = document.createElement("span");
        arrowIndicator.id = "arrow-indicator";
        arrowIndicator.className = "arrow";
        arrowIndicator.textContent = "▶";

        // ✅ outerHTML をここで保存しておく
        const arrowHTML = currentMode === "default" ? arrowIndicator.outerHTML : "";

        // 🧱 歌詞ブロックを描画
        blocks.forEach(block => { 
          const labelText = block["ラベル"] || "";
          const lyricsText = block["歌詞"] || "";

          // 🏷️ ラベル処理
          const labels = labelText.split(",").map(l => l.trim()).filter(Boolean);
          const labelGroupClass = `label-group label-${labels.length}`;
          const labelHTML = labels
            .map(label => `<span class="part-label ${label}">${label}</span>`)
            .join("");
                 
          // 🎶 歌詞整形
          const lyricsHTML = lyricsText.replace(/\\n/g, "<br>");

          // 🎨 背景色生成（人数に関係なくラベル順に並べる）
          const lyricBackground = labels.map((label, i) => {
            const color = labelColors[label] || "rgba(240,240,240,0.3)";
            const start = (i / labels.length) * 100;
            const end = ((i + 1) / labels.length) * 100;
            return `${color} ${start}%, ${color} ${end}%`;
          }).join(", ");
          const gradient = `linear-gradient(to right, ${lyricBackground})`;
          
           // 📦 DOM構築
          const line = document.createElement("div");
          line.className = `line ${labelGroupClass}`;
          line.innerHTML = `
            <div class="${labelGroupClass}">
              ${labelHTML}
            </div>
            <div class="lyric-text" style="background: ${gradient}; width: ${maxWidth}px;">
              ${lyricsHTML}
            </div>
          `;

          if (currentMode === "blind") {
            const labelGroup = line.querySelector(".label-group");// ラベルを取得
            // 背景を透明にする
            const lyricBox = line.querySelector(".lyric-text");

            if (labelGroup) {
              labelGroup.style.visibility = "hidden"; // ラベルを非表示
            }
            if (lyricBox) {
              lyricBox.style.background = "transparent"; // 背景を透明に
            }
          }

          container.appendChild(line);
        });
        
     // ▶マークを最初のラベルに差し込む
        const lines = document.querySelectorAll(".line");
        if (lines.length > 0) {
          const firstLine = lines[0];
          firstLine.style.visibility = "visible"; // ✅ 最初の行を表示

          const labelContainer = firstLine.querySelector(".label-group");
          const lyricBox = firstLine.querySelector(".lyric-text");

          if (currentMode === "default") {
            if (labelContainer) {
              labelContainer.style.visibility = "visible";
              labelContainer.prepend(arrowIndicator); // ▶を差し込む
            }
            currentIndex = 1; // 次のクリックで2行目へ
          } else if (currentMode === "blind") {
            // ✅ ラベルは非表示のまま、背景も透明のまま
            if (labelContainer) {
              labelContainer.style.visibility = "hidden";
            }
            if (lyricBox) {
              lyricBox.style.background = "transparent";
            }
            currentIndex = 0; // 最初のクリックで1行目のラベル＋背景を表示
          }
        } 

      document.removeEventListener("click", handleClick); // 一度削除してから再登録
      document.addEventListener("click", handleClick);
       
    })

      .catch(err => {
        document.getElementById("lyrics-container").innerHTML = "<p>歌詞の読み込みに失敗しました。</p>";
        console.warn("歌詞読み込みエラー", err);
      });
    }