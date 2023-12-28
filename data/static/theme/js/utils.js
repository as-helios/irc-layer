function select_random_item(list) {
    let random_index = Math.floor(Math.random() * list.length);
    return list[random_index];
}
function convert_urls_to_links(str) {
    const regex = /((?:https?|ftp):\/\/[^< ]+)/g;
    if (regex.test(str)) {
        return str.replace(regex, '<a href="$1" target="_blank" rel="noreferrer">$1</a>');
    }
    return str;
}
function strip_html_tags(str) {
  let regex_tags = /<\/?[a-z][\s\w]*[\/]?>/gi;
  let regex_attributes = /([A-Z])=[\"\'\s][^\s]+/g;
  str = str.replace(regex_tags, " ");
  str = str.replace(/&[0-9a-z]{2,5};/gi, "");
  str = str.replace(regex_attributes, "");
  str = str.trim();
  return str;
}
function convert_to_html_entities(text) {
    var entities = {
        '&': '&amp;',
        '<': '<',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
        '/': '&#x2F;',
    };
    return strip_html_tags(text).replace(/[&<'"\\/]/g, function(match) {
        return entities[match];
    });
}
function extract_hash_from_url(url) {
    url = url || window.location.href;
    let [mainUrl, fragment] = url.split('#');
    return fragment ? decodeURIComponent(fragment) : null;
}

function remove_hash_from_url() {
    let url_without_hash = window.location.pathname + window.location.search;
    history.pushState({}, document.title, url_without_hash);
    window.location.hash = '';
}

function generate_random_string(length) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
        result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
}

function spawn_modal_buttons(modal_type) {
    let buttons = [];
    switch (modal_type) {
        case 'confirm':
            var ok_button = document.createElement('button');
            ok_button.classList.add('modal-button');
            ok_button.classList.add('ok');
            ok_button.innerText = 'OK';
            buttons.push(ok_button);
            var cancel_button = document.createElement('button');
            cancel_button.classList.add('modal-button');
            cancel_button.classList.add('cancel');
            cancel_button.innerText = 'Cancel';
            buttons.push(cancel_button);
            break;
        case 'info':
            var ok_button = document.createElement('button');
            ok_button.classList.add('modal-button');
            ok_button.innerText = 'OK';
            buttons.push(ok_button);
            break;
        case 'error':
            var ok_button = document.createElement('button');
            ok_button.innerText = 'OK';
            buttons.push(ok_button);
            break;
        case 'warning':
            var ok_button = document.createElement('button');
            ok_button.innerText = 'OK';
            buttons.push(ok_button);
            break;
    }
    return buttons;
}

function hide_modal(overlay, modal) {
    [overlay, modal].forEach((element) => {
        element.classList.remove('show');
        element.classList.add('hide');
    });
    setTimeout(()=>{ overlay.remove(); }, 500);
}

function show_modal(content, modal_type = 'info', callback = null) {
    let overlay = document.createElement('div');
    overlay.classList.add('overlay');
    let modal = document.createElement('div');
    modal.classList.add(...['modal', modal_type]);
    let p = document.createElement('p');
    modal.appendChild(p);
    let p2 = document.createElement('p');
    p2.classList.add(...['text-right', 'no-padding', 'no-margin']);
    let buttons = spawn_modal_buttons(modal_type);
    for (var i = 0; i < buttons.length; i++) {
        p2.appendChild(buttons[i]);
        buttons[i].addListener('click', () => { hide_modal(overlay, modal); })
    }
    modal.appendChild(p2);
    modal.classList.add('show');
    overlay.appendChild(modal);
    overlay.classList.add('show');
    document.body.appendChild(overlay);
    if (modal_type != 'confirm') {
        overlay.addListener('click', () => { hide_modal(overlay, modal); })
    }
    if (typeof(content) == 'string') {
        p.innerHTML = content;
    } else {
        try {
            p.appendChild(content);
        } catch (e) {
            console.error(e);
            return false;
        } finally {
            if (modal_type == 'confirm' && callback != null) {
                content.parentElement.nextSibling.querySelector('button.modal-button.ok').addListener('click', function () {
                    let form_data = {};
                    for (var i = 0; i < content.children.length; i++) {
                        for (var i2 = 0; i2 < content.children[i].children.length; i2++) {
                            if (content.children[i].children[i2].name != null) {
                                switch (content.children[i].children[i2].classList.toString()) {
                                    case "string":
                                        form_data[content.children[i].children[i2].name] = content.children[i].children[i2].value.toString();
                                        break;
                                    case "integer":
                                        form_data[content.children[i].children[i2].name] = parseInt(content.children[i].children[i2].value);
                                        break;
                                    case "boolean":
                                        form_data[content.children[i].children[i2].name] = bool(content.children[i].children[i2].value);
                                        break;
                                    case "json":
                                        form_data[content.children[i].children[i2].name] = JSON.parse(content.children[i].children[i2].value);
                                        break;
                                }
                            }
                        }
                    };
                    callback(JSON.stringify(form_data));
                });
            }
        }
    }
}
function spawn_input_form(data) {
    let form = document.createElement('form');
    form.classList.add('modal-input');
    Object.keys(data).forEach((key, index) => {
        let div = document.createElement('div');
        let label = document.createElement('label');
        label.setAttribute('for', key);
        label.innerText = key.charAt(0).toUpperCase() + key.slice(1) + " ";
        div.appendChild(label);
        let input = document.createElement('input');
        input.id = key;
        input.name = key;
        input.classList.add(data[key]);
        div.appendChild(input);
        form.appendChild(div);
    });
    return form;
}
//show_modal(spawn_input_form({"nick": "integer", "nick2": "integer", "nick3": "integer"}), "confirm", alert);

document.addEventListener('keydown', function(event) {
   if ([13, 32].indexOf(event.keyCode) > -1 || [13, 32].indexOf(event.charCode) > -1) {
      let overlay = document.querySelector('.overlay');
      let modal = document.querySelector('.modal');
      if ([overlay, modal].indexOf(null) == -1 && !modal.classList.contains('confirm')) {
        event.preventDefault();
        hide_modal(overlay, modal);
      }
   }
});