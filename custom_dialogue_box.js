/*
    Copyright 2014 Jaycliff Arcilla of Eversun Software Philippines Corporation (Davao Branch)
    
    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at
    
        http://www.apache.org/licenses/LICENSE-2.0
    
    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
*/
/*jslint browser: true, devel: true, nomen: false, unparam: true, sub: false, bitwise: false, forin: false */
/*global $, jQuery, hasClass, addClass, removeClass*/
(function (global) {
    "use strict";
    var hasClass,
        addClass,
        removeClass;
    if (!document.documentElement.classList) {
        (function () {
            var collection_of_regex = {};
            hasClass = function (element, cls) {
                if (!collection_of_regex.hasOwnProperty(cls)) {
                    collection_of_regex[cls] = new RegExp('(?:^|\\s)' + cls + '(?!\\S)', 'g');
                }
                return collection_of_regex[cls].test(element.className);
            };
            addClass = function (element, cls) {
                if (!hasClass(element, cls)) {
                    element.className += (' ' + cls);
                }
            };
            removeClass = function (element, cls) {
                if (!collection_of_regex.hasOwnProperty(cls)) {
                    collection_of_regex[cls] = new RegExp('(?:^|\\s)' + cls + '(?!\\S)', 'g');
                }
                element.className = element.className.replace(collection_of_regex[cls], '');
            };
        }());
    } else {
        hasClass = function (element, cls) {
            return element.classList.contains(cls);
        };
        addClass = function (element, cls) {
            element.classList.add(cls);
        };
        removeClass = function (element, cls) {
            element.classList.remove(cls);
        };
    }
    if (typeof Object.defineProperty === "function") {
        Object.defineProperty(global, 'hasClass', {
            enumerable: false,
            configurable: false,
            writable: false,
            value: hasClass
        });
        Object.defineProperty(global, 'addClass', {
            enumerable: false,
            configurable: false,
            writable: false,
            value: addClass
        });
        Object.defineProperty(global, 'removeClass', {
            enumerable: false,
            configurable: false,
            writable: false,
            value: removeClass
        });
    } else {
        global.hasClass = hasClass;
        global.addClass = addClass;
        global.removeClass = removeClass;
    }
}(window));
(function (global, $) {
    "use strict";
    var $document = $(document), $window = $(global);
    $document.ready(function () {
        var customDialogueBox;
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
            addClass(close_span, 'g-icon');
            addClass(close_span, 'g-icon-remove');
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
                    okCallback,
                    cancelCallback,
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
                            event.preventDefault();
                            $ok.trigger('focus');
                            //$ok.trigger('click');
                        }
                    },
                    buttonTab = function buttonTab(event) {
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
                    },
                    positionDialog = function () {
                        $cdb.css('left', (Math.floor($document.outerWidth() / 2) - Math.floor($cdb.outerWidth() / 2)) + 'px');
                        $cdb.css('margin-top', (-Math.floor($cdb.outerHeight() / 2)) + 'px');
                    },
                    displayEntry = function () {
                        var entry = list_of_entries.shift();
                        entry_type = entry.type;
                        // Note: the $(element).text(value) method of jQuery won't change the actual textContent of the element if the value being passed is undefined
                        switch (entry_type) {
                        case 'alert':
                            $prompt_wrap.hide();
                            $ok.text('Ok');
                            $cancel.hide();
                            $ok.trigger('focus');
                            break;
                        case 'confirm':
                            $prompt_wrap.hide();
                            $ok.text('Yes');
                            $cancel.text('No').show();
                            okCallback = entry.okCallback;
                            cancelCallback = entry.cancelCallback;
                            $ok.trigger('focus');
                            break;
                        case 'prompt':
                            $prompt_wrap.show();
                            $ok.text('Ok');
                            $cancel.text('Cancel').show();
                            okCallback = entry.okCallback;
                            cancelCallback = entry.cancelCallback;
                            $prompt_input.trigger('focus');
                            break;
                        }
                        $message.text(entry.message);
                        $title.text(entry.title);
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
                            $document.off('keydown', buttonTab);
                            $overlay.stop().fadeOut(fade_speed, resetDB);
                        }
                    },
                    clickHandler = function (event) {
                        if (entry_type !== 'alert') {
                            callback_priority = true;
                            switch (entry_type) {
                            case 'confirm':
                                if ($.data(this, 'yes')) {
                                    if (typeof okCallback === "function") {
                                        okCallback(true);
                                    }
                                } else {
                                    if (typeof cancelCallback === 'function') {
                                        cancelCallback(false);
                                    }
                                }
                                break;
                            case 'prompt':
                                if ($.data(this, 'yes')) {
                                    if (typeof okCallback === "function") {
                                        okCallback($prompt_input.val());
                                    }
                                } else {
                                    if (typeof cancelCallback === 'function') {
                                        cancelCallback(null);
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
                $prompt_input.on('keydown', promptConfirm);
                entry_object_pool = (function () {
                    var pool = [];
                    function createObject() {
                        if (typeof Object.create === "function") {
                            return Object.create(null);
                        }
                        return {};
                    }
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
                $.data(ok, 'yes', true);
                $.data(cancel, 'yes', false);
                $.data(close, 'yes', false);
                $ok.on('click', clickHandler);
                $cancel.on('click', clickHandler);
                $close.on('click', clickHandler);
                function stringify(value, force_actual) {
                    var string;
                    switch (value) {
                    case null:
                        string = 'null';
                        break;
                    case undefined:
                        string = force_actual ? 'undefined' : '';
                        break;
                    default:
                        string = (typeof value === "string") ? value : value.toString();
                    }
                    return string;
                }
                function dialogueBoxCommonality(type, a, b, c, d) {
                    var entry = entry_object_pool.summon();
                    entry.type = type;
                    switch (type) {
                    case 'alert':
                        entry.message = stringify(a);
                        entry.title = stringify(b);
                        break;
                    default:
                        switch (typeof a) {
                        case 'object':
                            entry.message = stringify(a.message);
                            entry.title = stringify(a.title);
                            entry.okCallback = a.yes || a.ok || a.okCallback || a.yesCallback;
                            entry.cancelCallback = a.no || a.cancel || a.cancelCallback || a.noCallback;
                            break;
                        case 'function':
                            entry.message = '';
                            entry.title = '';
                            entry.okCallback = a;
                            entry.cancelCallback = b;
                            break;
                        default:
                            entry.message = stringify(a);
                            if (typeof b === "function") {
                                entry.title = '';
                                entry.okCallback = b;
                                entry.cancelCallback = c;
                            } else {
                                entry.title = stringify(b);
                                entry.okCallback = c;
                                entry.cancelCallback = d;
                            }
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
                        $document.on('keydown', buttonTab);
                        $overlay.stop().fadeIn(fade_speed);
                        displayEntry();
                    }
                }
                return {
                    confirm: function (a, b, c, d) {
                        cdb.className = 'cdb custom-dialogue-box cdb-confirm';
                        dialogueBoxCommonality('confirm', a, b, c, d);
                    },
                    prompt: function (a, b, c, d) {
                        cdb.className = 'cdb custom-dialogue-box cdb-prompt';
                        dialogueBoxCommonality('prompt', a, b, c, d);
                    },
                    alert: function (a, b) {
                        cdb.className = 'cdb custom-dialogue-box cdb-alert';
                        // Start emulation on how the native 'alert' handles the undefined value
                        if (a === undefined) {
                            a = stringify(a, (arguments.length > 0));
                        }
                        if (b === undefined) {
                            b = stringify(b, (arguments.length > 1));
                        }
                        // End emulation on how the native 'alert' handles the undefined value
                        dialogueBoxCommonality('alert', a, b);
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
