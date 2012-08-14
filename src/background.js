
chrome.contextMenus.create({
    title: 'BeeLine this text!',
    contexts: ['all'],
    onclick: function(info, tab) {
        chrome.tabs.sendMessage(tab.id, {type: 'ClickContextMenu'});
    }
});

