chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    var currentUrl = tab.url;
    if (currentUrl !== undefined) {
        var params = currentUrl.split('&');
        for (var a = 0; a < params.length; a++) {
            var param = params[a].split('=');
            if (param[0] === 'auth_token') {
                var index = chrome.extension.getURL('index.html');
                var new_url = index + '?auth_token=' + param[1];
                chrome.storage.local.set({'box-auth-token': param[1]}, function() {
                    chrome.tabs.update(tabId, {url: new_url});
                });
            }
        }
    }
});
