function isValidUrl(url) {
  return url.match(/https:\/\/www\.sooplive\.co\.kr\/directory\/category\/.*(\/vod|\/live)/);
}

let isNicknameFilterActive = false;
let isKeywordFilterActive = false;
let allowedNicknames = [];
let keywordFilters = { required: [], optional: [], excluded: [] };

function applyFilters() {
  chrome.storage.sync.get({
    isNicknameFilterActive: false,
    isKeywordFilterActive: false,
    allowed: [],
    keywordFilters: { required: [], optional: [], excluded: [] }
  }, data => {
    isNicknameFilterActive = data.isNicknameFilterActive;
    isKeywordFilterActive = data.isKeywordFilterActive;
    allowedNicknames = data.allowed;
    keywordFilters = data.keywordFilters;
    filterCBoxes();
  });
}

function filterCBoxes() {
  document.querySelectorAll('[data-type="cBox"]').forEach(cBox => {
    const clipNick = cBox.querySelector('.clip_nick')?.innerText.trim();
    const title = cBox.querySelector('.title a')?.innerText.trim();

    if (clipNick && title) {
      let shouldHide = false;

      if (isNicknameFilterActive && allowedNicknames.length > 0) {
        shouldHide = !allowedNicknames.includes(clipNick);
      }

      if (!shouldHide && isKeywordFilterActive && 
          (keywordFilters.required.length > 0 || 
           keywordFilters.optional.length > 0 || 
           keywordFilters.excluded.length > 0)) {
        const lowerTitle = title.toLowerCase();
        
        if (keywordFilters.required.length > 0) {
          shouldHide = !keywordFilters.required.every(keyword => lowerTitle.includes(keyword.toLowerCase()));
        }

        if (!shouldHide && keywordFilters.optional.length > 0) {
          shouldHide = !keywordFilters.optional.some(keyword => lowerTitle.includes(keyword.toLowerCase()));
        }

        if (!shouldHide && keywordFilters.excluded.length > 0) {
          shouldHide = keywordFilters.excluded.some(keyword => lowerTitle.includes(keyword.toLowerCase()));
        }
      }

      if (shouldHide) {
        cBox.style.cssText = 'display: none !important; visibility: hidden !important; opacity: 0 !important;';
      } else {
        cBox.style.cssText = '';
      }
    }
  });
}

// 초기 필터 적용
if (isValidUrl(window.location.href)) {
  applyFilters();
}

// 스토리지 변경 감지
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && isValidUrl(window.location.href)) {
    applyFilters();
  }
});

// MutationObserver를 사용하여 동적으로 추가되는 요소 감시
const observer = new MutationObserver(() => {
  if (isValidUrl(window.location.href)) {
    applyFilters();
  }
});

observer.observe(document.body, { childList: true, subtree: true });

// 메시지 리스너 추가
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "applyFilters" && isValidUrl(window.location.href)) {
    applyFilters();
  }
  return true;
});

// 페이지 로드 완료 시 필터 적용
window.addEventListener('load', () => {
  if (isValidUrl(window.location.href)) {
    applyFilters();
  }
});
