$(function() {
    $('#save-this-page').click(function(e) {
        e.preventDefault();
        chrome.tabs.getSelected(null, function(tab) {
            chrome.tabs.sendMessage(tab.id, {type: 'BeeLineSavePage'}, function(response) {
                console.log(response.farewell);
                window.close();
            });
        });
    });
});
