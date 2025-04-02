let filteredItemsCount = 0;

function isValidUrl(url) {
  return url.match(/https:\/\/www\.sooplive\.co\.kr\/directory\/category\/.*\/vod/);
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "updateFilteredItemsCount") {
    filteredItemsCount = request.count;
    chrome.action.setBadgeText({ text: filteredItemsCount.toString() });
  } else if (request.action === "getFilteredItemsCount") {
    sendResponse({ count: filteredItemsCount });
  }
  return true;  // 비동기 응답을 위해 true 반환
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && isValidUrl(tab.url)) {
    try {
      chrome.tabs.sendMessage(tabId, { action: "applyFilters" });
    } catch (error) {
      console.error("Error sending message to tab:", error);
    }
  }
});

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && (changes.isNicknameFilterActive || changes.isKeywordFilterActive || changes.allowed || changes.keywordFilters)) {
    chrome.tabs.query({active: true, currentWindow: true}, tabs => {
      if (tabs[0] && isValidUrl(tabs[0].url)) {
        try {
          chrome.tabs.sendMessage(tabs[0].id, { action: "applyFilters" });
        } catch (error) {
          console.error("Error sending message to active tab:", error);
        }
      }
    });
  }
});

chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (isValidUrl(tab.url)) {
      chrome.action.enable(activeInfo.tabId);
    } else {
      chrome.action.disable(activeInfo.tabId);
    }
  });
});

// 초기화 기능 추가
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "resetSettings") {
    chrome.storage.sync.set({
      allowed: [],
      isNicknameFilterActive: false,
      isKeywordFilterActive: false,
      keywordFilters: { required: [], optional: [], excluded: [] }
    }, () => {
      if (chrome.runtime.lastError) {
        console.error("설정 초기화 중 오류 발생:", chrome.runtime.lastError);
      } else {
        console.log("설정이 초기화되었습니다.");
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
          chrome.tabs.sendMessage(tabs[0].id, {action: "applyFilters"});
        });
      }
    });
  }
});
