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