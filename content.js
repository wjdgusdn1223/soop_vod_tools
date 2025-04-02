function filterCBoxes(allowed) {
  document.querySelectorAll('.clip_nick').forEach(el => {
    const nick = el.innerText.trim();
    const cBox = el.closest('[data-type="cBox"]');
    if (!allowed.includes(nick) && cBox?.closest('.cBox-list')) cBox.remove();
  });
}

// 저장된 allowed 목록을 가져오고, 기본값은 ["페닷"]으로 설정합니다.
chrome.storage.sync.get({ allowed: ["페닷"] }, data => {
  filterCBoxes(data.allowed);
});
