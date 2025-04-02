let allowedNicknames = [];
let isNicknameFilterActive = false;
let isKeywordFilterActive = false;
let keywordFilters = { required: [], optional: [], excluded: [] };

function renderNicknames() {
  const list = document.getElementById("nicknames");
  list.innerHTML = "";
  allowedNicknames.forEach((nick, index) => {
    const li = document.createElement("li");
    li.textContent = nick;
    const removeBtn = document.createElement("button");
    removeBtn.textContent = "×";
    removeBtn.addEventListener("click", () => {
      allowedNicknames.splice(index, 1);
      saveSettings();
      renderNicknames();
      showToast("스트리머 닉네임이 삭제되었습니다.");
    });
    li.appendChild(removeBtn);
    list.appendChild(li);
  });
}

function renderKeywordTags() {
  ['required', 'optional', 'excluded'].forEach(type => {
    const container = document.getElementById(`${type}KeywordTags`);
    container.innerHTML = "";
    keywordFilters[type].forEach((keyword, index) => {
      const tag = document.createElement("span");
      tag.className = "tag";
      tag.textContent = keyword;
      const removeBtn = document.createElement("span");
      removeBtn.className = "remove";
      removeBtn.textContent = "×";
      removeBtn.addEventListener("click", () => {
        keywordFilters[type].splice(index, 1);
        saveSettings();
        renderKeywordTags();
        showToast("키워드가 삭제되었습니다.");
      });
      tag.appendChild(removeBtn);
      container.appendChild(tag);
    });
  });
}

function saveSettings() {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.set({
      allowed: allowedNicknames,
      isNicknameFilterActive,
      isKeywordFilterActive,
      keywordFilters
    }, () => {
      if (chrome.runtime.lastError) {
        console.error("설정 저장 중 오류 발생:", chrome.runtime.lastError);
        reject(chrome.runtime.lastError);
      } else {
        console.log("설정이 저장되었습니다.");
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
          chrome.tabs.sendMessage(tabs[0].id, {action: "applyFilters"});
        });
        resolve();
      }
    });
  });
}

function loadSettings() {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get({
      allowed: [],
      isNicknameFilterActive: false,
      isKeywordFilterActive: false,
      keywordFilters: { required: [], optional: [], excluded: [] }
    }, data => {
      if (chrome.runtime.lastError) {
        console.error("설정 불러오기 중 오류 발생:", chrome.runtime.lastError);
        reject(chrome.runtime.lastError);
      } else {
        allowedNicknames = data.allowed;
        isNicknameFilterActive = data.isNicknameFilterActive;
        isKeywordFilterActive = data.isKeywordFilterActive;
        keywordFilters = data.keywordFilters;
        renderNicknames();
        renderKeywordTags();
        document.getElementById("nicknameFilterToggle").checked = isNicknameFilterActive;
        document.getElementById("keywordFilterToggle").checked = isKeywordFilterActive;
        resolve();
      }
    });
  });
}

function isValidUrl(url) {
  return url.match(/https:\/\/www\.sooplive\.co\.kr\/directory\/category\/.*\/vod/);
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.style.display = "block";
  setTimeout(() => {
    toast.style.display = "none";
  }, 3000);
}

function resetSettings() {
  allowedNicknames = [];
  isNicknameFilterActive = false;
  isKeywordFilterActive = false;
  keywordFilters = { required: [], optional: [], excluded: [] };
  
  document.getElementById("nicknameFilterToggle").checked = false;
  document.getElementById("keywordFilterToggle").checked = false;
  
  renderNicknames();
  renderKeywordTags();
  saveSettings();
  showToast("설정이 초기화되었습니다.");
}

document.addEventListener("DOMContentLoaded", () => {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    const url = tabs[0].url;
    if (!isValidUrl(url)) {
      document.body.innerHTML = "<p>이 페이지에서는 필터를 사용할 수 없습니다.</p>";
      return;
    }
    
    loadSettings().then(() => {
      if (typeof Sortable !== 'undefined') {
        new Sortable(document.getElementById("nicknames"), {
          animation: 150,
          onEnd: () => {
            allowedNicknames = Array.from(document.querySelectorAll("#nicknames li")).map(li => li.textContent.replace("×", "").trim());
            saveSettings();
          }
        });
      } else {
        console.error("Sortable is not defined. Make sure Sortable.min.js is loaded correctly.");
      }

      document.getElementById("addNickname").addEventListener("click", () => {
        const newNick = document.getElementById("newNickname").value.trim();
        if (newNick && !allowedNicknames.includes(newNick)) {
          allowedNicknames.push(newNick);
          saveSettings()
            .then(() => {
              renderNicknames();
              document.getElementById("newNickname").value = "";
              showToast("스트리머 닉네임이 추가되었습니다.");
            })
            .catch(error => console.error("스트리머 닉네임 추가 중 오류 발생:", error));
        }
      });

      document.getElementById("nicknameFilterToggle").addEventListener("change", (e) => {
        isNicknameFilterActive = e.target.checked;
        saveSettings()
          .then(() => showToast("스트리머 닉네임 필터가 " + (e.target.checked ? "활성화" : "비활성화") + "되었습니다."))
          .catch(error => console.error("스트리머 닉네임 필터 토글 중 오류 발생:", error));
      });

      document.getElementById("keywordFilterToggle").addEventListener("change", (e) => {
        isKeywordFilterActive = e.target.checked;
        saveSettings()
          .then(() => showToast("키워드 필터가 " + (e.target.checked ? "활성화" : "비활성화") + "되었습니다."))
          .catch(error => console.error("키워드 필터 토글 중 오류 발생:", error));
      });

      ['required', 'optional', 'excluded'].forEach(type => {
        document.getElementById(`${type}Keywords`).addEventListener("keydown", (e) => {
          if (e.key === "Enter" && e.target.value.trim()) {
            keywordFilters[type].push(e.target.value.trim());
            saveSettings()
              .then(() => {
                renderKeywordTags();
                e.target.value = "";
                showToast("키워드가 추가되었습니다.");
              })
              .catch(error => console.error("키워드 추가 중 오류 발생:", error));
          }
        });
      });

      document.getElementById("saveSettings").addEventListener("click", () => {
        const settingName = document.getElementById("settingName").value.trim();
        if (settingName) {
          const settings = {
            allowed: allowedNicknames,
            isNicknameFilterActive,
            isKeywordFilterActive,
            keywordFilters
          };
          chrome.storage.sync.set({ [settingName]: settings }, () => {
            document.getElementById("settingName").value = "";
            updateSavedSettingsList();
            showToast("설정이 저장되었습니다.");
          });
        } else {
          showToast("설정 이름을 입력해주세요.");
        }
      });

      document.getElementById("loadSettings").addEventListener("click", () => {
        const settingName = document.getElementById("savedSettings").value;
        if (settingName) {
          chrome.storage.sync.get(settingName, (items) => {
            if (items[settingName]) {
              const settings = items[settingName];
              allowedNicknames = settings.allowed;
              isNicknameFilterActive = settings.isNicknameFilterActive;
              isKeywordFilterActive = settings.isKeywordFilterActive;
              keywordFilters = settings.keywordFilters;
              saveSettings()
                .then(() => {
                  loadSettings();
                  showToast("설정을 불러왔습니다.");
                })
                .catch(error => console.error("설정 불러오기 중 오류 발생:", error));
            } else {
              showToast("해당 이름의 설정을 찾을 수 없습니다.");
            }
          });
        } else {
          showToast("불러올 설정을 선택해주세요.");
        }
      });

      document.getElementById("deleteSettings").addEventListener("click", () => {
        const settingName = document.getElementById("savedSettings").value;
        if (settingName) {
          chrome.storage.sync.remove(settingName, () => {
            showToast("설정이 삭제되었습니다.");
            updateSavedSettingsList();
          });
        } else {
          showToast("삭제할 설정을 선택해주세요.");
        }
      });

      document.getElementById("resetSettings").addEventListener("click", resetSettings);

      updateSavedSettingsList();
    }).catch(error => console.error("초기 설정 불러오기 중 오류 발생:", error));
  });
});

function updateSavedSettingsList() {
  chrome.storage.sync.get(null, (items) => {
    const settingsNames = Object.keys(items).filter(key => typeof items[key] === "object" && items[key].allowed);
    const select = document.getElementById("savedSettings");
    select.innerHTML = '<option value="">저장된 설정 선택</option>';
    settingsNames.forEach(name => {
      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      select.appendChild(option);
    });
  });
}
