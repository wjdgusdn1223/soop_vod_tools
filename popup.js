function renderNicknames(allowed) {
  const list = document.getElementById("nicknames");
  list.innerHTML = "";
  allowed.forEach((nick, index) => {
    const li = document.createElement("li");
    li.textContent = nick;
    const removeBtn = document.createElement("button");
    removeBtn.textContent = "삭제";
    removeBtn.addEventListener("click", () => {
      allowed.splice(index, 1);
      chrome.storage.sync.set({ allowed }, () => renderNicknames(allowed));
    });
    li.appendChild(removeBtn);
    list.appendChild(li);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.sync.get({ allowed: ["페닷"] }, data => {
    renderNicknames(data.allowed);
  });

  document.getElementById("addNickname").addEventListener("click", () => {
    const newNick = document.getElementById("newNickname").value.trim();
    if (newNick) {
      chrome.storage.sync.get({ allowed: [] }, data => {
        const allowed = data.allowed;
        allowed.push(newNick);
        chrome.storage.sync.set({ allowed }, () => {
          renderNicknames(allowed);
          document.getElementById("newNickname").value = "";
        });
      });
    }
  });
});
