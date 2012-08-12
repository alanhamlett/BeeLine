
function Beeline() {
    this.box_api_key = '154an88atpieas5b19jbvx4xysxshq9n';
    this.box_auth_token = '';
    this.storage = chrome.storage.local;
    this.SetupFirebase();
    this.Login();
    return this;
}

Beeline.prototype.SetupFirebase = function() {
    this.firebase = new Firebase('http://gamma.firebase.com/BeeLine/');
    this.urls = {};
    this.GetUrls();
    this.firebase.on('child_added', $.proxy(function(data) {
        this.NewUrl(data.val());
    }, this));
};

Beeline.prototype.GetUrls = function() {
    this.storage.get(null, $.proxy(function(data) {
        if (data['firebase-urls'] !== undefined && data['firebase-urls'] !== null) {
            this.urls = data['firebase-urls'];
            for (var i in this.urls) {
                this.AddUrlToPage(this.urls[i]);
            }
        }
    }, this));
};

Beeline.prototype.NewUrl = function(url) {
    this.urls[url.url] = url;
    this.AddUrlToPage(url);
};

Beeline.prototype.AddUrlToPage = function(url) {
    var $this = this;
    $('<div class="row"><div class="span8 box-file"><a href="#"><i class="icon-file"></i> '+url.name+'</a></div></div>').appendTo('#box-files').data(
        'url-info', {url: url.url, name: url.name}
    ).click(function() {
        $this.OpenUrl($(this).data('url-info'));
    });
};

Beeline.prototype.RemoveUrlFromPage = function(url) {
    var url_info = url.data('url-info');
    delete this.urls[url_info.url];
    this.storage.set('firebase-urls', this.urls);
    $(url).parent().remove();
};

Beeline.prototype.OpenUrl = function(url) {
    chrome.tabs.create(
        {
            url: url.url,
            active: true
        },
        $.proxy(function(tab) {
            chrome.tabs.executeScript(tab.id, {
                file: 'beeline.js',
                allFrames: true,
                runAt: 'document_end'
            });
        }, this)
    );
};

Beeline.prototype.SetupEvents = function() {
    $('#auth-to-box').click(this.BoxAuth);
    $('#logged-out > a').click(this.BoxAuth);
    $('#logout').click($.proxy(this.Logout, this));
};

Beeline.prototype.BoxAuth = function(e) {
    e.preventDefault();
    $.ajax({
        url: 'https://www.box.com/api/1.0/rest?action=get_ticket&api_key=154an88atpieas5b19jbvx4xysxshq9n',
        dataType: 'text',
        success: function(data, textStatus, jqXHR) {
            data = $($.parseXML(data));
            var ticket = data.find('ticket').text();
            //var myurl = chrome.extension.getURL('index.html');
            var box_auth_url = 'https://www.box.com/api/1.0/auth/'+ticket;
            window.location = box_auth_url;
        }
    })
};

Beeline.prototype.BoxAPI = function(options) {
    $.extend(options, {
        headers: {
            Authorization: 'BoxAuth api_key='+this.box_api_key+'&auth_token='+this.box_auth_token,
            dataType: 'text',
            success: function(data, textStatus, jqXHR) {
                if (data !== undefined) {
                    data = JSON.parse(data);
                    if (data.error === undefined) {
                        options.success(data);
                    } else {
                        options.error(data.message);
                    }
                }
                return undefined;
            },
            error: function(data) {
                var responseText = data.responseText;
                if (responseText !== undefined) {
                    var json = JSON.parse(resonseText);
                    if (json.error === undefined)
                        json['error'] = 'unknown';
                    options.error(json.error);
                } else {
                    options.error('unknown');
                }
            }
        }
    });
    if (options.url.indexOf('http') !== 0) {
        options.url = 'https://api.box.com/2.0/' + options.url;
    }
    $.ajax(options);
};

Beeline.prototype.SetupBoxAPI = function() {
    if (this.box_auth_token) {
        this.BoxAPI({
            url: 'users',
            success: $.proxy(function(json) {
                //console.log(json);
                $('#logged-out').hide();
                $('#username').text(json.name);
                $('#logged-in').show();
                this.SetupBoxFiles();
            }, this),
            error: $.proxy(function(message) {
                console.warn(message);
                this.Logout();
            }, this)
        });
    } else {
        this.Logout();
    }
};

Beeline.prototype.SetupBoxFiles = function() {
    this.BoxAPI({
        url: 'folders/0',
        success: $.proxy(function(json) {
            var items = json.item_collection.entries;
            for (var i in items) {
                if (items[i].type === 'file')
                    this.AddFile(items[i]);
            }
        }, this),
        error: function(message) {
            console.warn(message);
        }
    });
};

Beeline.prototype.AddFile = function(file) {
    var $this = this;
    $('<div class="row"><div class="span8 box-file"><a href="#"><i class="icon-file"></i> '+file.name+'</a></div></div>').appendTo('#box-files').data(
        'file-info', {id: file.id, name: file.name, type: file.type, etag: file.etag}
    ).click(function() {
        $this.OpenFile(this)
    });
};

Beeline.prototype.OpenFile = function(fileElement) {
    var file = $(fileElement).data('file-info');
    console.log(file);
    this.BoxAPI({
        type: 'PUT',
        url: 'files/'+file.id,
        data: '{"shared_link": {"access": "open"}}',
        success: $.proxy(function(json) {
            window.location = json.shared_link.url;
        }, this),
        error: function(message) {
            console.warn(message);
        }
    });
};

Beeline.prototype.Login = function() {
    $('#logged-in').hide();
    var currentUrl = window.location.href;
    if (currentUrl !== undefined) {
        var params = currentUrl.split('&');
        for (var a = 0; a < params.length; a++) {
            var param = params[a].split('=');
            if (param[0] === 'auth_token') {
                this.storage.set({'box-auth-token': param[1]}, function() {
                    this.CheckBoxAuthToken();
                });
                return;
            }
        }
    }
    this.CheckBoxAuthToken();
};

Beeline.prototype.CheckBoxAuthToken = function() {
    this.storage.get(null, $.proxy(function(data) {
        if (data['box-auth-token'] !== undefined && data['box-auth-token'] !== null) {
            this.box_auth_token = data['box-auth-token'];
            $('#box-auth-token').val(this.box_auth_token);
        }
        this.SetupEvents();
        this.SetupBoxAPI();
    }, this));
}

Beeline.prototype.Logout = function() {
    $('#logged-in').hide();
    $('#logged-out').show();
    this.storage.set({'box-auth-token': ''});
};

$(function() {
    var beeline = new Beeline();
});
