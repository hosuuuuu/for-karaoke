fetch("../json/lives.json")
  .then(res => res.json())
  .then(lives => {
    const container = document.getElementById("live-list-container");

    lives
      .sort((a, b) => new Date(b.date) - new Date(a.date)) // ✅ 新しい順
      .forEach(live => {
        const card = document.createElement("a");
        card.className = "card";
        card.href = `../html/${live.id}.html`;

        const title = live["title "]?.trim() || "タイトル未定";
        const date = new Date(live.date).toLocaleDateString("ja-JP");

        card.innerHTML = `
          <img src="../images/${live.id}.webp" alt="${title}">
          <p>${title}</p>
        `;

        container.appendChild(card);
      });
  });