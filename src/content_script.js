
function FormatPage() {
    var max = 170;
    var page = {};
    page['title'] = $('title:first').text();
    page['text'] = '';
    $('p').each(function() {
        page['text'] = page['text'] + ' ' + $(this).text();
    });
    $('script').remove();
    $('style').remove();
    $('link').remove();
    $('body').text('');
    var count = 0;
    var current;
    var styles = [
        '<p style="background:-webkit-gradient(linear,0% 0%,70% 0%,from(black),to(blue),color-stop(0,black));-webkit-background-clip:text;-webkit-text-fill-color:transparent;"></p>',
        '<p style="background:-webkit-gradient(linear,0% 0%,70% 0%,from(blue),to(black),color-stop(0,blue));-webkit-background-clip:text;-webkit-text-fill-color:transparent;"></p>',
        '<p style="background:-webkit-gradient(linear,0% 0%,70% 0%,from(black),to(red),color-stop(0,black));-webkit-background-clip:text;-webkit-text-fill-color:transparent;"></p>',
        '<p style="background:-webkit-gradient(linear,0% 0%,70% 0%,from(red),to(black),color-stop(0,red));-webkit-background-clip:text;-webkit-text-fill-color:transparent;"></p>'
    ];
    var current_style = 0;
    for (var c in page['text']) {
        if (count === 0) {
            current = $(styles[current_style]);
            current_style++;
            if (current_style > styles.length - 1)
                current_style = 0;
        }
        count++;
        var letter = page['text'][c];
        $(current).append(letter);
        if (count > max && letter === ' ') {
            $('body').append(current);
            count = 0;
        }
    }
    if (count !== 0) {
        $('body').append(current);
    }
}

function SavePage() {
    var firebase = new Firebase('http://gamma.firebase.com/BeeLine/');
    var url = window.location.href;
    firebase.push({name: document.title, url: url});
}

chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
    console.log(sender.tab ? "from a content script:" + sender.tab.url : "from the extension");
    if (request.type == 'BeeLineSavePage') {
        SavePage();
        sendResponse({farewell: "goodbye"});
    }
});

window.addEventListener('message', function(event) {
    if (event.source !== window) {
        return;
    }
    if (event.data === 'BeeLineFormatPage') {
        FormatPage();
    }
});

