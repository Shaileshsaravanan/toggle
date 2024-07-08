chrome.webNavigation.onCompleted.addListener(function(details) {
    chrome.tabs.sendMessage(details.tabId, {action: "pageLoaded"});
});
  
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === "resizeTab") {
      chrome.tabs.update(sender.tab.id, {
        width: request.width,
        height: request.height
      });
    }
  });