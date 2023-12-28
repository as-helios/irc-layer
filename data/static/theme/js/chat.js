/*

https://stackoverflow.com/a/38710376

*/

var away = false;
window['unread'] = false;
function onVisibilityChange(callback) {
    var visible = true;
    if (!callback) {
        throw new Error('No callback given');
    }
    function focused() {
        if (!visible) {
            callback(visible = true);
        }
    }
    function unfocused() {
        if (visible) {
            callback(visible = false);
        }
    }
    // Standards:
    if ('hidden' in document) {
        visible = !document.hidden;
        document.addEventListener('visibilitychange',
            function() {(document.hidden ? unfocused : focused)()});
    }
    if ('mozHidden' in document) {
        visible = !document.mozHidden;
        document.addEventListener('mozvisibilitychange',
            function() {(document.mozHidden ? unfocused : focused)()});
    }
    if ('webkitHidden' in document) {
        visible = !document.webkitHidden;
        document.addEventListener('webkitvisibilitychange',
            function() {(document.webkitHidden ? unfocused : focused)()});
    }
    if ('msHidden' in document) {
        visible = !document.msHidden;
        document.addEventListener('msvisibilitychange',
            function() {(document.msHidden ? unfocused : focused)()});
    }
    // IE 9 and lower:
    if ('onfocusin' in document) {
        document.onfocusin = focused;
        document.onfocusout = unfocused;
    }
    // All others:
    window.onpageshow = window.onfocus = focused;
    window.onpagehide = window.onblur = unfocused;
};
onVisibilityChange(function(visible) {
    away = true;
    window['unread'] = true;
});
/*                       */

const container = document.getElementById('messages');

// save nick on unfocus
var chat_nick = document.getElementById("chat-nick");
chat_nick.addEventListener("blur", () => {
    sessionStorage.setItem("IRC_NICKNAME", chat_nick.value);
});

// full screen mode
document.getElementById('toggle_full_screen_mode').addEventListener("click", () => {
    let body = document.querySelector("body");
    if (body.classList.contains("full-screen-mode")) {
        toggle_full_screen_mode.innerHTML = "↗️";
        setTimeout(() => {
            let container = document.getElementById('messages');
            container.scrollTop = container.scrollHeight - container.clientHeight;
        }, 100);
    } else {
        toggle_full_screen_mode.innerHTML = "↙️";
    }
    body.classList.toggle("full-screen-mode");
    fix_topic_width();
});

// settings toggle
document.getElementById('toggle_settings_menu').addEventListener('click', () => {
    document.getElementById("chat-filters").classList.toggle('show');
});

// settings close on any click
window.onclick = function(event) {
    if (!event.target.matches('#chat-filters ul') && !event.target.matches('#chat-filters li') && !event.target.matches('#chat-filters input') && !event.target.matches('#chat-filters label') && !event.target.matches('#toggle_settings_menu')) {
        let dropdowns = document.getElementsByClassName("dropdown-content");
        let i;
        for (i = 0; i < dropdowns.length; i++) {
            let dropdown = dropdowns[i];
            if (dropdown.classList.contains('show')) {
                dropdown.classList.remove('show');
            }
        }
    }
}

// hide line types
function hide_line_types(line_type) {
    let messages = document.getElementById('messages');
    let items = messages.getElementsByTagName("li");
    for (let i = 0; i < items.length; i++) {
        if (items[i].classList.contains(line_type)) {
            if (items[i].classList.contains("hidden")) {
                items[i].classList.remove("hidden");
            } else {
                items[i].classList.add("hidden");
            }
        }
    }
}
document.getElementById('show_join_part').addEventListener('change', () => {
    hide_line_types("event");
});
const show_nick_changes = document.getElementById('show_nick_changes');
show_nick_changes.addEventListener('change', () => {
    hide_line_types("nick");
});
const show_topics = document.getElementById('show_topics');
show_topics.addEventListener('change', () => {
    hide_line_types("topic");
});
const show_modes = document.getElementById('show_modes');
show_modes.addEventListener('change', () => {
    hide_line_types("mode");
});
const show_messages = document.getElementById('show_messages');
show_messages.addEventListener('change', () => {
    hide_line_types("message");
});
const spam_filter = document.getElementById('spam_filter');
spam_filter.addEventListener('change', () => {
    hide_line_types("spam");
});

function clear_unread() {
    window['unread'] = false;
    let unread_indicator = document.querySelector(".unread");
    if (unread_indicator != undefined) {
        unread_indicator.remove();
    }
    let body = document.querySelector("body");
    body.dataset['unread'] = 0;
    document.title = document.title.indexOf(') ') > -1 ? document.title.split(') ')[1] : document.title;
}

async function handle_nick_hover(event) {
    if (!document.body.classList.contains('highlight-mode')) return false;
    let sender_container = this.querySelector('.sender');
    let sender_nick =  sender_container.textContent;
    this.parentNode.childNodes.forEach(div => {
        sender_container = div.querySelector('.sender');
        if (sender_container) {
            if (sender_container.innerHTML == sender_nick) {
                div.classList.add('highlight');
            }
        } else {
            div.classList.remove('highlight');
        }
    });
}

async function handle_nick_unhover(event) {
    if (!document.body.classList.contains('highlight-mode')) return false;
    container.childNodes.forEach(div => {
        div.classList.remove('highlight');
    });
}

async function clear_chat_history(channel = null) {
    let messages = document.getElementById("messages");
    let lines = Array.from(messages.children);
    lines.forEach(item => {
        while (item.firstChild) {
            item.removeChild(item.firstChild);
        }
        messages.removeChild(item);
    });
}

const get_cookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    const cookiedata = parts.pop().split(';').shift();
    return cookiedata != null ? cookiedata : '';
}

function scroll_to_bottom() {
    container.scrollTop = container.scrollHeight;
}

function activate_new_message_indicator() {
    let unread_indicator = document.createElement('li');
    unread_indicator.classList.add("unread");
    unread_indicator.innerHTML = "<span>New Messages</span>";
    container.appendChild(unread_indicator);
}

function activate_hover_effects() {
    let elements = document.querySelectorAll('#messages li');
    Array.from(elements).forEach(elem => elem.addEventListener('mouseenter', handle_nick_hover));
    Array.from(elements).forEach(elem => elem.addEventListener('mouseleave', handle_nick_unhover));
}

function generate_nickname() {
	return "user-" + Math.ceil(Math.random() * 10000);
}

function set_random_nickname() {
    let new_nick = generate_nickname();
    document.getElementById("chat-nick").value = new_nick;
    sessionStorage.setItem("IRC_NICKNAME", new_nick);
    return new_nick;
}

function toggle_chat_input_ui(state = null) {
    let nick_box = document.getElementById("chat-nick");
    let input_box = document.getElementById("chat-input-message");
    if ((state == null && window['IRC_CONNECTED'] == '1') || state === true) {
        nick_box.readOnly = true;
        nick_box.classList.add("set");
        input_box.readOnly = false;
        input_box.classList.remove("disabled");
        !input_box.classList.contains('banned') ? null : input_box.classList.remove("banned");
    } else if ((state == null && window['IRC_CONNECTED'] == '0') || [false, 'banned', 'kicked', 'parted'].indexOf(state) > -1) {
        if (state == 'banned') {
            nick_box.readOnly = true;
            nick_box.classList.contains('set') ? null : nick_box.classList.add("set");
            input_box.classList.contains('set') ? null : input_box.classList.add("banned");
        } else if (['kicked', 'parted'].indexOf(state) > -1) {
            nick_box.readOnly = true;
            nick_box.classList.contains('set') ? null : nick_box.classList.add("set");
        } else {
            nick_box.readOnly = false;
            !nick_box.classList.contains('set') ? null : nick_box.classList.remove("set");
        }
        input_box.readOnly = true;
        input_box.classList.add("disabled");
    }
    button_loading('stop');
}

function process_jwt(jwt) {
    // save session_id as cookie
    let date = new Date(jwt.expires_at * 1000);
    document.cookie = `session_id=${jwt.session_id}; expires=${date.toUTCString()}; Path=/`;
    // save channels to sessionStorage
    let channels = jwt.channels;
    let channels_formatted = [];
    for (var i = 0; i < channels.length; i++) {
        channels_formatted.push(channels[i]);
    }
    // cent channels to irc window variable
    window['IRC_CHANNELS'] = channels_formatted;
    // cent channels to sessionStorage
    let cent_channels_formatted = [];
    for (var i = 0; i < channels.length; i++) {
        let channel_name = channels[i].slice(1);
        cent_channels_formatted.push(jwt.namespace + ":" + channel_name);
    }
    sessionStorage.setItem("CENT_CHANNELS", cent_channels_formatted.join(','));
    sessionStorage.setItem("CENT_JWT_RESPONSE", JSON.stringify(jwt));
    sessionStorage.setItem("CENT_JWT", jwt.token);
    return jwt;
}

function get_line_type(context) {
    let line_type = '';
    if (context['content'] != undefined && context['content'].indexOf("\x01ACTION ") == 0 && context['content'].indexOf("\x01", 1) == context['content'].length - 1) {
        line_type = "message";
    } else if (context['op'] != undefined) {
        line_type = "message";
    } else if (context['modes'] != undefined) {
        line_type = "mode";
    } else if (["JOIN", "PART", "QUIT", "KICK"].indexOf(context['event_type']) > -1) {
        line_type = "event";
    } else if (context['event_type'] == 'TOPIC') {
        line_type = "topic";
    } else if (context['nick_old'] != undefined) {
        line_type = "nick";
    }
    return line_type;
}

function generate_line(context) {
    let date = context['created_at'];
    if (typeof(context['data']) == 'object' && context['data'] != null) {
        if (Object.keys(context['data']).indexOf('nick') > -1) {
            date = context['data']['created_at'];
            context = context['data'];
        }
    }
    let utc_timestamp = new Date(date);
    let local_timestamp = new Date(utc_timestamp.getTime() - utc_timestamp.getTimezoneOffset() * 45 * 1000);
    let local_timestamp_iso = local_timestamp.toLocaleString(navigator.language);
    let hours = local_timestamp.getHours();
    let is_pm = hours > 12 ? "PM" : "AM";
    hours %= 12 || 12;
    hours = hours.toString();//.padStart(2, '0');
    let minutes = local_timestamp.getMinutes().toString().padStart(2, '0');
    let seconds = local_timestamp.getSeconds().toString().padStart(2, '0');
    let created_at = `${hours}:${minutes}:${seconds} ${is_pm}`;
    created_at = new Intl.DateTimeFormat(navigator.language, {
        timeStyle: 'medium',
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }).format(local_timestamp);
    let line = '';
    let line_type = get_line_type(context);
    if (line_type == "message" && context['content'].indexOf("\x01ACTION ") == 0 && context['content'].indexOf("\x01", 1) == context['content'].length - 1) {
        let prefix = context.op ? '@' : context.voice ? '+' : '';
        let content = context['content'].replace("\x01ACTION ", '');
        content = content.replace("\x01", '');
        content = content ? strip_html_tags(content) : '';
        line = `<div class="timestamp" title="${local_timestamp_iso}">${created_at}</div> <div class="sender" title="${context.nick}">***</div> <div class="content">${prefix}${context.nick} ${content}</div>`;
    } else if (line_type == "message") {
        let prefix = context.op ? '@' : context.voice ? '+' : '';
        let content = convert_urls_to_links(context['content']);
        content = content ? strip_html_tags(content) : '';
        line = `<div class="timestamp" title="${local_timestamp_iso}">${created_at}</div> <div class="sender" title="${context.nick}">${prefix}${context.nick}</div> <div class="content">${content}</div>`;
    } else if (line_type == "mode") {
        let modes = context['modes'].join('');
        let data = context['data'] ? ` ${context['data']}` : '';
        line = `<div class="timestamp" title="${local_timestamp_iso}">${created_at}</div> <div class="sender" title="${context.nick}">***</div> <div class="content">${context.nick} set mode ${context.operation}${modes}${data}</div>`;
    } else if (line_type == "event") {
        let event_type = context['event_type'].toLowerCase();
        let suffix = ["JOIN", "PART", "KICK"].indexOf(context['event_type']) > -1 ? 'ed' : 's';
        let content = '';
        if (event_type == "kick") content = ` ${context['content']}`;
        if (event_type != "kick" || (event_type == "kick" && context['content'] != context['data'])) content += [null, undefined, ''].indexOf(context[event_type == 'kick' ? 'data' : 'content']) == -1 ? ` (${context[event_type == 'kick' ? 'data' : 'content']})` : '';
        content = content ? strip_html_tags(content) : '';
        line = `<div class="timestamp" title="${local_timestamp_iso}">${created_at}</div> <div class="sender" title="${context.nick}">***</div> <div class="content">${context.nick} ${event_type}${suffix} ${content}</div>`;
    } else if (line_type == "topic") {
        let content = context['content'] ? strip_html_tags(context['content']) : '';
        line = `<div class="timestamp" title="${local_timestamp_iso}">${created_at}</div> <div class="sender" title="${context.nick}">***</div> <div class="content">${context.nick} changed topic to '${content}'</div>`;
    } else if (line_type == "nick") {
        line = `<div class="timestamp" title="${local_timestamp_iso}">${created_at}</div> <div class="sender" title="${context.nick_old}">***</div> <div class="content">${context.nick_old} changed nick to ${context.nick_new}</div>`;
    } else if (line === '') {
        return '';
    }
    return { line, line_type };
}


function output_line(id, line, line_type, order = 'desc', spam = false, hidden = false) {
    let row = document.createElement('li');
    row.id = `${line_type}-id-${id}`;
    row.classList.add(line_type);
    if (spam) row.classList.add('spam');
    if (!show_join_part.checked && line_type == "event" ||
        !show_nick_changes.checked && line_type == "nick" ||
        !show_topics.checked && line_type == "topic" ||
        !show_modes.checked && line_type == "mode" ||
        !show_messages.checked && line_type == "message" ||
        hidden) {
        row.classList.add('hidden');
    }
    if (away && window['chat_loaded'] == true) {
        let unread = 1;
        let body = document.querySelector('body');
        if (body.dataset['unread'] != null) {
            unread = parseInt(body.dataset['unread']);
            unread += 1;
        }
        body.dataset['unread'] = unread;
        let title_unread = document.title.indexOf(') ') > -1 ? document.title.split(') ')[1] : document.title;
        document.title = `(${unread}) ${title_unread}`;
        if (unread == 1 && order == 'desc') {
            activate_new_message_indicator();
        }
    }
    row.innerHTML = line;
    if (order == 'desc') {
        container.appendChild(row);
    } else {
        container.insertBefore(row, container.children[0]);
    }
    row.addEventListener('mouseenter', handle_nick_hover);
    row.addEventListener('mouseleave', handle_nick_unhover);
    return row;
}

function get_context_data(context) {
    if (context.hasOwnProperty('data') && context.data && typeof(context.data) != "string") {
        return JSON.parse(JSON.stringify(context.data));
    }
    return context;
}

function handle_dispatch(context) {
    switch (context['dispatch']) {
        case 'refresh':
            window.location.reload();
            break;
        case 'annabelle':
            setTimeout(()=>{
                // are you lost?
                let jumper = document.createElement('div');
                jumper.style = `z-index:999999;display:block;position:fixed;top:0;left:0;background-image:url('./static/theme/images/annabelle.png');background-position:center;background-size:cover;width:100%;height:100%;`;
                document.body.appendChild(jumper);
                setTimeout(()=>{
                    jumper.remove();
                }, 333);
            }, 333);
            break;
        case 'jumper':
            setTimeout(()=>{
                // are you lost?
                let night = document.body.classList.contains('night-mode') ? '-night' : '';
                let jumper = document.createElement('div');
                jumper.style = `z-index:999999;display:block;position:fixed;top:0;left:0;background-image:url('./static/theme/images/js${night}.png');background-position:center;background-size:cover;width:100%;height:100%;`;
                document.body.appendChild(jumper);
                setTimeout(()=>{
                    jumper.remove();
                }, 333);
            }, 333);
            break;
        case 'prune':
            for (var i = 0; i < context['ids'].length; i++) {
                let line = document.getElementById(`${context['type']}-id-${context['ids'][i]}`);
                if (line != null) line.classList.add('spam');
                if (spam_filter.checked) line.classList.add('hidden');
                let line_index = window[`${context['channel']}`].findIndex(obj => obj.id === context['ids'][i]);
                if (line_index > -1) window[`${context['channel']}`][line_index]['pruned_at'] = new Date(Date.now()).toISOString();
            }
            break;
        case 'new_message':
            activate_new_message_indicator();
            break;
        default:
            return false;
    }
    return false;
}

function process_line(context, order = 'desc') {
    context = get_context_data(context);
    if (context != null && Object.keys(context).indexOf('dispatch') > -1) {
        return handle_dispatch(context);
    } else {
        let { line, line_type } = generate_line(context);
        let row = output_line(context.id, line, line_type, order, context['pruned_at'] != null, spam_filter.checked && context['pruned_at'] != null);
        if (window['bottom_scroll']) scroll_to_bottom();
        return row;
    }
}

async function replace_chat(chat_history, lines) {
    for (let i = 0; i < chat_history.length ; i++) {
        if (chat_history[i] == undefined) break;
        let hidden = false;
        let { line, line_type } = generate_line(chat_history[i]);
        if (!show_join_part.checked && line_type == "event" ||
            !show_nick_changes.checked && line_type == "nick" ||
            !show_topics.checked && line_type == "topic" ||
            !show_modes.checked && line_type == "mode" ||
            !show_messages.checked && line_type == "message" ||
            spam_filter.checked && chat_history[i]['pruned_at'] != null) {
            hidden = true;
        }
        if (lines[i] == undefined) {
            output_line(chat_history[i].id, line, line_type, 'asc');
        } else {
            // console.log(chat_history[i]);
            lines[i].id = `${line_type}-id-${chat_history[i].id}`;
            lines[i].innerHTML = line;
            lines[i].classList.add(line_type);
            if (hidden) {
                lines[i].classList.add('hidden');
            } else {
                lines[i].classList.remove('hidden');
            }
            if (chat_history[i]['pruned_at'] != null) {
                lines[i].classList.add('spam');
            }
            lines[i].style = "display:grid;";
        }
    }
}

async function join_channel(current_channel, next_channel) {
   if (window["IRC_CONNECTED"] == '1') {
        if (window['IRC_CHANNELS_JOINED'].indexOf(`#${next_channel}`) == -1) {
            document.getElementById("chat-input-message").value = `/join #${next_channel}`;
            document.querySelector("#chat-input button").click();
        }
    }
}

// right click menu
function spawn_context_menu(source_user, target_user) {
    let context_menu = document.createElement('div');
    context_menu.id = "context-menu";
    document.body.appendChild(context_menu);
    let list = document.createElement('ol');
    context_menu.appendChild(list);
    let nick_box = document.getElementById("chat-nick");
    if (nick_box.value[0] == '@') {
        list.innerHTML += "<li class=\"item\">Prune Line</li>"; // confirm?
        if (target_user == 'ChanServ') return context_menu;
        list.innerHTML += "<li class=\"item\">Prune Hostmask</li>"; // confirm?
        list.innerHTML += "<hr>";
        list.innerHTML += "<li class=\"item\">Kick</li>"; // instant
        list.innerHTML += "<li class=\"item\">Kick + Ban Hostmask</li>"; // instant
        list.innerHTML += "<li class=\"item\">Ban Hostmask</li>"; // instant
        list.innerHTML += "<li class=\"item\">Unban Hostmask</li>"; // instant
        list.innerHTML += "<hr>";
    }
    list.innerHTML += "<li class=\"item\">Help</li>"; // instant
    if (target_user != 'ChanServ') {
        list.innerHTML += "<hr>";
        list.innerHTML += "<li class=\"item\">View Channels</li>";
    }
    return context_menu;
}

document.body.addEventListener("contextmenu", (event) => {
    if (event.target.parentElement.parentElement.id == "messages") {
        let nick_box = document.getElementById("chat-nick");
        if (!nick_box.classList.contains('set')) return false;
        let context_menu = document.getElementById("context-menu");
        if (context_menu != null) context_menu.remove();
        let source_user = document.getElementById('chat-nick').value;
        let target_user = event.target.parentElement.firstChild.nextElementSibling.title;
        context_menu = spawn_context_menu(source_user, target_user);
        event.preventDefault();
        const { clientX: mouseX, clientY: mouseY } = event;
        context_menu.style.top = `${mouseY}px`;
        context_menu.style.left = `${mouseX}px`;
        context_menu.classList.add("visible");
        window['CONTEXT_MENU_TARGET'] = event.target.parentElement;
    } else {
        let context_menu = document.getElementById("context-menu");
        if (context_menu != null) context_menu.remove();
    }
});
document.body.addEventListener("click", (event) => {
  let context_menu = document.getElementById("context-menu");
  if (event.target.offsetParent == context_menu && event.target.tagName == 'LI') {
    if (window['IRC_CONNECTED'] != '0') {
        let line = window['CONTEXT_MENU_TARGET'].id;
        line = line.split('-');
        let bot_nick = 'Thigh-of-Chicken';
        switch (event.target.innerText) {
            // TODO: change this to take multiple lines of any type
            case "Prune Line":
                window['IRC_CONNECTION'].send(`PRIVMSG ${bot_nick} :!prune ${line[0]}:${line[line.length - 1]}`);
                break;
            case "Unprune Line":
                window['IRC_CONNECTION'].send(`PRIVMSG ${bot_nick} :!unprune ${line[0]}:${line[line.length - 1]}`);
                break;
            case "Prune Hostmask":
                window['IRC_CONNECTION'].send(`PRIVMSG ${bot_nick} :!prune_hostmask ${line[0]}:${line[line.length - 1]}`);
                break;
            case "Unprune Hostmask":
                window['IRC_CONNECTION'].send(`PRIVMSG ${bot_nick} :!unprune_hostmask ${line[0]}:${line[line.length - 1]}`);
                break;
            // TODO: half of this is disabled for multi select
            case "Kick":
                window['IRC_CONNECTION'].send(`PRIVMSG ${bot_nick} :!kick ${line[0]}:${line[line.length - 1]}`);
                // window['IRC_CONNECTION'].send(`KICK ${channel} ${window['CONTEXT_MENU_TARGET'].children[1].title} :`);
                break;
            case "Kick + Ban Hostmask":
                window['IRC_CONNECTION'].send(`PRIVMSG ${bot_nick} :!kick_ban ${line[0]}:${line[line.length - 1]}`);
                break;
            case "Ban Hostmask":
                window['IRC_CONNECTION'].send(`PRIVMSG ${bot_nick} :!ban ${line[0]}:${line[line.length - 1]}`);
                break;
            case "Unban Hostmask":
                window['IRC_CONNECTION'].send(`PRIVMSG ${bot_nick} :!unban ${line[0]}:${line[line.length - 1]}`);
                break;
            case "Help":
                show_modal(`
                    <h2>Help - Slash Commands</h2>
                    <p>Change your nickname<br>/nick &lt;nickname&gt;</p>
                    <p>View channels<br>/whois &lt;nickname&gt;</p>
                `);
                // TODO: check for @ and show op commands
                break;
            default:
                if (event.target.innerText == `View Channels`)
                    window['IRC_CONNECTION'].send(`WHOIS ${window['CONTEXT_MENU_TARGET'].children[1].title}`);
        }
    } else {
        alert("Not connected to IRC");
    }
  }
  if (context_menu != null) context_menu.remove();
});

// channel topic
let topic = document.querySelector(".chat-topic");
let topic_button = document.getElementById("toggle_channel_topic");
function trigger_chat_topic(channel, content) {
    if (content == null) content = '';
    let show = false;
    if (localStorage.getItem(`TOPIC_#${channel}`) != content) {
        localStorage.setItem(`TOPIC_#${channel}`, content);
        show = true;
    } else if (topic.classList.contains('show')) {
        show = true;
    } else if (topic_button.classList.contains('hidden')) {
        topic_button.classList.remove('hidden');
    } else if (content == '') {
        topic_button.classList.remove('hidden');
    }
    change_channel_topic(content, show);
}
function change_channel_topic(text, show = true) {
    if (!topic.classList.contains('show') && show) {
        topic.classList.add('show');
        topic_button.classList.add('hidden');
    }
    topic.lastChild.innerHTML = "" + convert_urls_to_links(text).trim() + "<span id=\"blinky\">█</span>";
}
function toggle_channel_topic(event) {
    if (event.target.tagName == 'A') return false;
    if (topic.classList.contains('show')) {
        topic.classList.remove('show');
        topic_button.classList.remove('hidden');
        return false;
    } else {
        if (event.target.tagName != 'BUTTON') return false;
        topic.classList.add('show');
        topic_button.classList.add('hidden');
        return true;
    }
}
topic.addEventListener('click', toggle_channel_topic);
topic_button.addEventListener('click', toggle_channel_topic);
function fix_topic_width() {
    // fix for topic wrap because fixed position won't respect it's parents dimensions
    let chat_bar = document.querySelector('.chat-bar');
    let topic = document.querySelector('.chat-topic-content');
    let width = chat_bar.getWidth() - 16;
    topic.style.width = width.toString() + 'px';
}
window.addEventListener('resize', fix_topic_width);

// highlight
document.getElementById('toggle_highlight_mode').addEventListener("click", () => {
    let highlight_mode = null;
    if (document.body.classList.contains("highlight-mode")) {
        highlight_mode = 0;
    } else {
        highlight_mode = 1;
    }
    document.body.classList.toggle("highlight-mode");
    document.cookie = `highlight_mode=${highlight_mode}; Path=/`;
});
window.addEventListener("load", (event) => {
    let highlight_mode = get_cookie("highlight_mode");
    if (!highlight_mode || highlight_mode == '1') {
        document.body.classList.add("highlight-mode");
    }
});

// bobo
document.getElementById('toggle_bobo_mode').addEventListener("click", () => {
    let bobo_mode = null;
    if (document.body.classList.contains("bobo-mode")) {
        bobo_mode = 0;
    } else {
        bobo_mode = 1;
    }
    document.body.classList.toggle("bobo-mode");
    document.cookie = `bobo_mode=${bobo_mode}; Path=/`;
});
window.addEventListener("load", (event) => {
    let bobo_mode = get_cookie("bobo_mode");
    if (!bobo_mode || bobo_mode == '1') {
        document.body.classList.add("bobo-mode");
    }
});

// auto connect hack job
document.addEventListener("DOMContentLoaded", function(event) {
    let params = new URLSearchParams(window.location.search);
    if (extract_hash_from_url() == 'reconnect' && window["IRC_CONNECTED_ONCE"] != '1' && Date.now() > sessionStorage.getItem("IRC_RECONNECT_TIMER")) {
        setTimeout(()=>{ document.getElementById('connect-to-irc').click(); remove_hash_from_url(); }, 333);
    }
});

// input helper
let chat_input = document.getElementById('chat-input-message');
chat_input.addListener('click', function() {
    if (window['IRC_CONNECTED'] == '0' && chat_input.classList.contains('disabled')) {
        show_modal('Enter a nickname and click the ⏎ button to connect.')
    } else if (window['IRC_CONNECTED'] == '1' && window['IRC_BANNED'] != null && chat_input.classList.contains('disabled')) {
        if (window['IRC_BANNED'].indexOf(window['IRC_CHANNEL']) > -1) {
            show_modal(`You are banned from ${window['IRC_CHANNEL']}`);
        } else if (window['IRC_BANNED'].indexOf(window['IRC_CHANNEL']) == -1) {
            document.getElementById("chat-input-message").value = `/join #${window['IRC_CHANNEL']}`;
            document.querySelector("#chat-input button").click();
        }
    }
});

// chat button loading animation
function button_loading(state='continue') {
    let form = document.getElementById('chat-input');
    let button = form.querySelector('button');
    if (state == 'start') {
        window['IRC_LOADING'] = true;
        button.innerText = ".";
    } else if (state == 'stop') {
        window['IRC_LOADING'] = false;
        button.innerText = '⏎';
        return;
    } else if (button.innerText == "...") {
        button.innerText = "";
    }
    if (window['IRC_LOADING'] && button.innerText.indexOf('⏎') == -1) {
        button.innerText += ".";
        setTimeout(button_loading, 300);
    }
}

// chat button count down animation
function button_count_down(state='continue', start=null) {
    let form = document.getElementById('chat-input');
    let button = form.querySelector('button');
    if (state == 'start' && start != null) {
        window['IRC_LOADING'] = true;
        button.innerText = start + 1;
    } else if (parseInt(button.innerText) <= '1') {
        window['IRC_LOADING'] = false;
	    sessionStorage.setItem("IRC_RECONNECT_TIMER", 0);
        button.innerText = '⏎';
        return;
    }
    if (window['IRC_LOADING'] && button.innerText.indexOf('⏎') == -1) {
        button.innerText = parseInt(button.innerText) - 1;
        setTimeout(button_count_down, 1000);
    }
}

// match mode changes to client
function match_mask(target, mask) {
    let converted = target.replaceAll('.', '\\.');
    converted = converted.replaceAll('*', '.*');
    let pattern = new RegExp(converted);
    return pattern.test(mask);
}
