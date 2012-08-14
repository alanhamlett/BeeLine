
function FormatPage() {
    window.stop();
    var max = 100;
    var page = {
        title: document.title,
        p: {}
    };
    $('p').each(function() {
        var $p = $(this);
        var $key = $p.parent()[0];
        $key = $key.nodeName+':'+$key.id+':'+$key.className;
        if (page.p[$key] === undefined) {
            page.p[$key] = [];
        }
        page.p[$key].push($p.text());
    });
    var len = 0;
    var key = null;
    for (var k in page.p) {
        if (page.p[k].length > len) {
            len = page.p[k].length;
            key = k;
        }
    }
    $('script').remove();
    $('style').remove();
    $('link').remove();
    $('body').text('');
    var GetP = function(start, end) {
        return '<p style="margin:5px 50px 5px 50px;background:-webkit-gradient(linear,0% 0%,70% 0%,from('+start+'),to('+end+'),color-stop(0,'+start+'));-webkit-background-clip:text;-webkit-text-fill-color:transparent;"></p>';
    }
    var styles = [
        GetP('black', 'blue'),
        GetP('blue', 'black'),
        GetP('black', 'red'),
        GetP('red', 'black')
    ];
    for (var k in page.p[key]) {
        var current_style = 0;
        var count = 0;
        var $current_line;
        var paragraph = page.p[key][k];
        for (var c in paragraph) {
            var letter = paragraph[c];
            if (letter === "\n")
                letter = ' ';
            if (count === 0) {
                $current_line = $(styles[current_style]);
                current_style++;
                if (current_style > styles.length - 1)
                    current_style = 0;
            }
            count++;
            $current_line.append(letter);
            if (count > max && letter === ' ') {
                $('body').append($current_line);
                count = 0;
            }
        }
        if (count !== 0) {
            $('body').append($current_line);
        }
        $('body').append($('<br />'));
    }
}

chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
    console.log(sender.tab ? "from a content script:" + sender.tab.url : "from the extension");
    if (request.type == 'ClickContextMenu') {
        FormatPage();
    }
});

