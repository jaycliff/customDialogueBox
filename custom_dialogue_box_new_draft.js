/*jslint browser: true, devel: true, nomen: false, unparam: true, sub: false, bitwise: false, forin: false */
/*global $, jQuery, hasClass, addClass, removeClass*/
(function (global, $) {
    "use strict";
    var $document = $(document), $window = $(global);
    $document.ready(function () {
        var customDialogueBox, allow_ocd = false;
        (function setupDialogMarkup() {
            var overlay = document.createElement('div'),
                cdb = document.createElement('div'),
                close = document.createElement('div'),
                close_span = document.createElement('span'),
                title = document.createElement('div'),
                message = document.createElement('div'),
                prompt_wrap = document.createElement('div'),
                prompt_input = document.createElement('input'),
                button_tray = document.createElement('div'),
                ok = document.createElement('button'),
                cancel = document.createElement('button');
            overlay.setAttribute('id', 'cdb-overlay');
            overlay.setAttribute('style', 'display: none;');
            addClass(cdb, 'cdb');
            addClass(cdb, 'cdb-confirm-box');
            addClass(close, 'cdb-close');
            addClass(close_span, 'glyphicon');
            addClass(close_span, 'glyphicon-remove');
            addClass(title, 'cdb-title');
            addClass(message, 'cdb-message');
            addClass(prompt_wrap, 'cdb-prompt-wrap');
            addClass(prompt_input, 'cdb-prompt-input');
            addClass(button_tray, 'cdb-button-tray');
            prompt_input.setAttribute('name', 'cdb-prompt-input');
            prompt_input.setAttribute('placeholder', 'Enter a value');
            prompt_input.setAttribute('value', '');
            ok.setAttribute('type', 'button');
            cancel.setAttribute('type', 'button');
            ok.textContent = 'Ok';
            cancel.textContent = 'Cancel';
            button_tray.appendChild(ok);
            button_tray.appendChild(cancel);
            close.appendChild(close_span);
            cdb.appendChild(close);
            cdb.appendChild(title);
            cdb.appendChild(message);
            prompt_wrap.appendChild(prompt_input);
            cdb.appendChild(prompt_wrap);
            cdb.appendChild(button_tray);
            overlay.appendChild(cdb);
            document.body.appendChild(overlay);
            customDialogueBox = (function () {
                var active = false,
                    callback_priority = false,
                    entry_object_pool,
                    entry_type = '',
                    fade_speed = 80,
                    yesCallback,
                    noCallback,
                    list_of_entries = [],
                    // list_of_prioritized_entries is for the instances made inside the callbacks
                    list_of_prioritized_entries = [],
                    $overlay = $(overlay),
                    $cdb = $(cdb),
                    $close = $(close),
                    $title = $(title),
                    $message = $(message),
                    $prompt_wrap = $(prompt_wrap),
                    $prompt_input = $(prompt_input),
                    $ok = $(ok),
                    $cancel = $(cancel),
                    promptConfirm = function (event) {
                        if (document.activeElement === prompt_input && event.which === 13) {
                            //$ok.trigger('click');
                            event.preventDefault();
                            $ok.trigger('focus');
                        }
                    },
                    buttonTab = function buttonTab(event) {
                        //event.stopPropagation();
                        if (event.which === 9) {
                            event.preventDefault();
                            if (entry_type === 'alert') {
                                if (document.activeElement !== $ok[0]) {
                                    $ok.trigger('focus');
                                }
                            } else {
                                if (document.activeElement === $ok[0]) {
                                    $cancel.trigger('focus');
                                } else {
                                    $ok.trigger('focus');
                                }
                            }
                        }
                        //console.log('tab switching is active');
                    },
                    positionDialog = function () {
                        $cdb.css('left', (Math.floor($document.outerWidth() / 2) - Math.floor($cdb.outerWidth() / 2)) + 'px');
                        $cdb.css('margin-top', '-' + Math.floor($cdb.outerHeight() / 2) + 'px');
                    },
                    displayEntry = function () {
                        var entry = list_of_entries.shift();
                        entry_type = entry.type;
                        switch (entry_type) {
                        case 'alert':
                            $prompt_wrap.hide();
                            $ok.text('Ok');
                            $cancel.hide();
                            $ok[0].focus();
                            break;
                        case 'confirm':
                            $prompt_wrap.hide();
                            $ok.text('Yes');
                            $cancel.text('No').show();
                            yesCallback = entry.yesCallback;
                            noCallback = entry.noCallback;
                            $ok[0].focus();
                            break;
                        case 'prompt':
                            $prompt_wrap.show();
                            $ok.text('Ok');
                            $cancel.text('Cancel').show();
                            yesCallback = entry.yesCallback;
                            noCallback = entry.noCallback;
                            $prompt_input[0].focus();
                            break;
                        }
                        $message.text(entry.message);
                        $title.text(entry.title);
                        //$ok.trigger('focus');
                        positionDialog();
                        entry_object_pool.banish(entry);
                    },
                    resetDB = function () {
                        entry_type = '';
                        $message.text('');
                        $title.text('');
                        $prompt_input.val('');
                    },
                    confirmation = function () {
                        if (list_of_entries.length > 0) {
                            resetDB();
                            displayEntry();
                        } else {
                            active = false;
                            $window.off('resize', positionDialog);
                            $document.off('keydown', buttonTab).off('keydown', promptConfirm);
                            $overlay.stop().fadeOut(fade_speed, resetDB);
                        }
                    },
                    clickHandler = function (event) {
                        console.log('click');
                        if (entry_type !== 'alert') {
                            callback_priority = true;
                            switch (entry_type) {
                            case 'confirm':
                                if ($.data(this, 'yes')) {
                                    if (typeof yesCallback === "function") {
                                        yesCallback(true);
                                    }
                                } else {
                                    if (typeof noCallback === 'function') {
                                        noCallback(false);
                                    }
                                }
                                break;
                            case 'prompt':
                                if ($.data(this, 'yes')) {
                                    if (typeof yesCallback === "function") {
                                        yesCallback($prompt_input.val());
                                    }
                                } else {
                                    if (typeof noCallback === 'function') {
                                        noCallback(null);
                                    }
                                }
                                break;
                            }
                            callback_priority = false;
                            while (list_of_prioritized_entries.length > 0) {
                                list_of_entries.unshift(list_of_prioritized_entries.pop());
                            }
                        }
                        confirmation();
                    };
                entry_object_pool = (function () {
                    var pool = [];
                    function createObject() {
                        if (typeof Object.create === "function") {
                            return Object.create(null);
                        }
                        return {};
                    }
                    //global.pool = pool;
                    return {
                        'summon': function () {
                            if (pool.length > 0) {
                                return pool.pop();
                            }
                            return createObject();
                        },
                        'banish': function (entry) {
                            var key;
                            for (key in entry) {
                                if (Object.prototype.hasOwnProperty.call(entry, key)) {
                                    delete entry[key];
                                }
                            }
                            pool.push(entry);
                        }
                    };
                }());
                $.data($ok[0], 'yes', true);
                $.data($cancel[0], 'yes', false);
                $.data($close[0], 'yes', false);
                $ok.on('click', clickHandler);
                $cancel.on('click', clickHandler);
                $close.on('click', clickHandler);
                function dbCommonality(type, a, b, c, d) {
                    var entry = entry_object_pool.summon();
                    entry.type = type;
                    switch (type) {
                    case 'alert':
                        entry.message = a;
                        entry.title = b;
                        break;
                    default:
                        switch (typeof a) {
                        case 'object':
                            entry.message = a.message || '';
                            entry.title = a.title || '';
                            entry.yesCallback = a.yesCallback;
                            entry.noCallback = a.noCallback;
                            break;
                        case 'function':
                            entry.message = '';
                            entry.title = '';
                            entry.yesCallback = a;
                            entry.noCallback = b;
                            break;
                        default:
                            entry.message = a;
                            if (typeof b === "function") {
                                entry.title = '';
                                entry.yesCallback = b;
                                entry.noCallback = c;
                            } else {
                                entry.title = b;
                                entry.yesCallback = c;
                                entry.noCallback = d;
                            }
                            break;
                        }
                    }
                    if (callback_priority) {
                        list_of_prioritized_entries.push(entry);
                    } else {
                        list_of_entries.push(entry);
                    }
                    if (!active) {
                        active = true;
                        $window.on('resize', positionDialog);
                        $document.on('keydown', buttonTab).on('keydown', promptConfirm);
                        $overlay.stop().fadeIn(fade_speed);
                        displayEntry();
                    }
                }
                return {
                    confirm: function (a, b, c, d) {
                        cdb.className = 'cdb cdb-confirm';
                        if (allow_ocd) {
                            if (a === undefined) {
                                if (arguments.length > 0) {
                                    a = 'undefined';
                                } else {
                                    a = '';
                                }
                            }
                            if (b === undefined) {
                                if (arguments.length > 1) {
                                    b = 'undefined';
                                } else {
                                    b = '';
                                }
                            }
                        }
                        dbCommonality('confirm', a, b, c, d);
                    },
                    prompt: function (a, b, c, d) {
                        cdb.className = 'cdb cdb-prompt';
                        if (allow_ocd) {
                            if (a === undefined) {
                                if (arguments.length > 0) {
                                    a = 'undefined';
                                } else {
                                    a = '';
                                }
                            }
                            if (b === undefined) {
                                if (arguments.length > 1) {
                                    b = 'undefined';
                                } else {
                                    b = '';
                                }
                            }
                        }
                        dbCommonality('prompt', a, b, c, d);
                    },
                    alert: function (a, b) {
                        cdb.className = 'cdb cdb-alert';
                        if (allow_ocd) {
                            if (a === undefined) {
                                if (arguments.length > 0) {
                                    a = 'undefined';
                                } else {
                                    a = '';
                                }
                            }
                            if (b === undefined) {
                                if (arguments.length > 1) {
                                    b = 'undefined';
                                } else {
                                    b = '';
                                }
                            }
                        }
                        dbCommonality('alert', a, b);
                    }
                };
            }());
        }());
        if (typeof Object.defineProperty === "function") {
            Object.defineProperty(global, 'customDialogueBox', {
                enumerable: false,
                configurable: false,
                writable: false,
                value: customDialogueBox
            });
        } else {
            global.customDialogueBox = customDialogueBox;
        }
    });
}(window, jQuery));
