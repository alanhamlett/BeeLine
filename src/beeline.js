

function Beeline() {
    this.box_api_key = '154an88atpieas5b19jbvx4xysxshq9n';
    this.box_auth_token = '';
    this.storage = chrome.storage.local;
    this.Login();
    return this;
}

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
        success: function(json) {
            console.log(json);
        },
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

