import { Centrifuge } from 'centrifuge';
import { CentClient } from 'cent.js';
import WebSocket from 'ws';
import jwt from 'jsonwebtoken';
import process from 'process';
import express from 'express';
import Knex from 'knex';
import { Model } from 'objection';

class IRCChannels extends Model {static get tableName() { return 'irc_channels'; }}
class IRCBannedPhrases extends Model {static get tableName() { return 'irc_banned_phrases'; }}
class IRCBannedHostmasks extends Model {static get tableName() { return 'irc_banned_hostmasks'; }}
class IRCBannedHostnames extends Model {static get tableName() { return 'irc_banned_hostnames'; }}
class IRCBannedNicks extends Model {static get tableName() { return 'irc_banned_nicks'; }}

const knex = Knex({
    client: 'pg',
    connection: {
      host: process.env.POSTGRES_HOST,
      database: process.env.POSTGRES_DB,
      user:     process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD
    },
    pool: {
      min: 2,
      max: 10
    }
});
Model.knex(knex);
const cent = new CentClient({
    url: process.env.CENTRIFUGO_API_URL,
    token: process.env.CENTRIFUGO_API_KEY
});

function get_line_type(data) {
    let line_type = '';
    if (data['content'] != undefined && data['content'].indexOf("\x01ACTION ") == 0 && data['content'].indexOf("\x01", 1) == data['content'].length - 1) {
        line_type = "message";
    } else if (data['op'] != undefined) {
        line_type = "message";
    } else if (data['modes'] != undefined) {
        line_type = "mode";
    } else if (["JOIN", "PART", "QUIT", "KICK"].indexOf(data['event_type']) > -1) {
        line_type = "event";
    } else if (data['event_type'] == 'TOPIC') {
        line_type = "topic";
    } else if (data['nick_old'] != undefined) {
        line_type = "nick";
    }
    return line_type;
}

async function get_channels() {
    let channels = await IRCChannels.query().select(['channel']);
    let results = [];
    channels.forEach((c)=>{
        results.push(c.channel);
    });
    return results;
}

async function get_jwt() {
    let subbed_channels = [];
    (await get_channels()).forEach((c) => {
        subbed_channels.push(`$secret:${c.slice(1)}`);
    });
    let token = jwt.sign({
        sub: 'dispatcher',
        channels: subbed_channels
    }, process.env.CENTRIFUGO_SECRET);
    return token;
}

function subscribe_to_channel(channel) {
    if (channel[0] == '#') channel = channel.slice(1);
    centrifuge.newSubscription(`$secret:${channel}`).on('publication', process_line);
}

async function process_line(context) {
    let channels = [context.channel];
    channels.push(context.channel.replace('$secret:', 'public:'));
    if (context.data.op == true) return false;
    if (context.data.dispatch != null) return false;
    if (context.data.modes != null) return false;
    if (await match_banned_records(context)) {
        let dispatch_data = {"dispatch": "prune", "ids": [context.data.id], "type": get_line_type(context.data), "channel": context.data.channel};
        channels.forEach((c) => {
            console.log(c, dispatch_data);
            cent.publish({
                channel: c,
                data: dispatch_data
            }).catch(err => handleError());
        });
    }
}

function match_banned_phrase_record(search, line, search_type) {
    if ((search_type == 'string' && line.indexOf(search) > -1) || (search_type == 'regex' && line.match(search))) {
        return true;
    }
    return false;
}

function match_banned_identity_record(a, b, search_columns) {
    let conditions = [];
    let search_type = a.search_type;
    switch (search_type) {
        case 'string':
            if (Array.isArray(search_columns)) {
                for (let i = 0; i < search_columns.length; i++) {
                    if (a[search_columns[i]] == b[search_columns[i]]) {
                        conditions.push(search_columns[i])
                    }
                }
                if (JSON.stringify(conditions.sort()) == JSON.stringify(search_columns.sort())) {
                    return true;
                }
            } else if (search_columns.indexOf(a)) {
                return true;
            }
            break;
        case 'regex':
            if (Array.isArray(search_columns)) {
                for (let i = 0; i < search_columns.length; i++) {
//                    console.log(search_columns[i]);
//                    console.log(a[search_columns[i]]);
//                    console.log(b[search_columns[i]]);
                    if (a[search_columns[i]].match(b[search_columns[i]])) {
                        conditions.push(search_columns[i])
                    }
//                    console.log(conditions);
//                    console.log(search_columns.sort());
//                    console.log(JSON.stringify(conditions.sort()) == JSON.stringify(search_columns.sort()));
                }
                if (JSON.stringify(conditions.sort()) == JSON.stringify(search_columns.sort())) {
                    return true;
                }
            } else if (a[search_columns].indexOf(b[search_columns])) {
                return true;
            }
            break;
    }
    return false;
}

async function get_banned_identity_filters() {
    let spam_filters = {}
    let records = [];
    let lists = ['hostnames', 'nicks', 'hostmasks'];
    for (let i = 0; i < lists.length; i++) {
        spam_filters[lists[i]] = {}
        spam_filters[lists[i]]['*'] = []
        switch (lists[i]) {
            case "nicks":
                records = await IRCBannedNicks.query().select('id', 'nick', 'search_type').where('disabled', false);
                break;
            case "hostmasks":
                records = await IRCBannedHostmasks.query().select('id', 'nick', 'hostname', 'search_type').where('disabled', false);
                break;
            case "hostnames":
                records = await IRCBannedHostnames.query().select('id', 'hostname', 'search_type').where('disabled', false);
                break;
        }
        for (let i2 = 0; i2 < records.length; i2++) {
            if (records[i2].channel_id != null) {
                let channel_name = await get_channel_name_from_id(records[i2].channel_id);
                spam_filters[lists[i]][channel_name].push(records[i2]);
            } else {
                spam_filters[lists[i]]['*'].push(records[i2]);
            }
        }
    }
    return spam_filters;
}

async function get_channel_name_from_id(id) {
    let channel_entry = await IRCChannels.query().select().where('id', id);
    return channel_entry.channel;
}

async function get_channel_id_from_name(name) {
    let channel_entry = await IRCChannels.query().select().where('channel', name);
    return channel_entry.id;
}

async function match_banned_phrase_records(line) {
    if (line['content'] == undefined) return false;
    let records = await IRCBannedPhrases.query().select('id', 'phrase', 'search_type').where('disabled', false);
    for (let i = 0; i < records.length; i++) {
        if (records[i].channel_id == null || records[i].channel_id == await get_channel_id_from_name(line.channel)) {
            if (records[i].search_type == 'string' && line['content'].indexOf(records[i].phrase) > -1) {
                return true;
            }
            if (records[i].search_type == 'regex' && line['content'].match(records[i].phrase)) {
                return true;
            }
        }
    }
    return false;
}

async function match_banned_identity(line) {
    let lists = ['hostnames', 'nicks', 'hostmasks'];
    let identity_filters = await get_banned_identity_filters();
    let channels = ['*', line.channel];
    for (let i = 0; i < lists.length; i++) {
        let search_columns = [];
        switch (lists[i]) {
            case "hostmasks":
                search_columns = ['nick', 'hostname'];
                break;
            case "hostnames":
                search_columns = ['hostname'];
                break;
            case "nicks":
                search_columns = ['nick'];
                break;
        }
        for (let i2 = 0; i2 < channels.length; i2++) {
            if (Object.keys(identity_filters[lists[i]]).indexOf(channels[i2]) == -1) continue
            for (let i3 = 0; i3 < identity_filters[lists[i]][channels[i2]].length; i3++) {
                if (match_banned_identity_record(
                        identity_filters[lists[i]][channels[i2]][i3],
                        line,
                        search_columns,
                        identity_filters[lists[i]][channels[i2]][i3].search_type)
                    ) {
                    return true;
                }
            }
        }
    }
    return false;
}

async function match_banned_records(context) {
    let channel = `#${context.channel.split(':')[1]}`;
    console.log(channel);
    let line = context.data;
    console.log(line);
    if (await match_banned_phrase_records(line) || await match_banned_identity(line)) {
        return true;
    }
}

// centrifugo
let connected_channels = [];
var centrifuge = new Centrifuge(`ws://centrifugo:3007/connection/websocket`, {
    websocket: WebSocket,
    getToken: get_jwt,
})
.on('subscribed', function(context) {
    connected_channels.push(`#${context.channel.split(':')[1]}`);
})
.on('unsubscribed', function(context) {
    connected_channels.pop(`#${context.channel.split(':')[1]}`);
});

// initial centrifugo connection
(await get_channels()).forEach((c) => {
    subscribe_to_channel(c.slice(1));
});
centrifuge.connect();

// web server
let app = express();
let port = process.env.WEB_SERVER_PORT;

app.get('/', async (req, res) => {
    res.send('Hello World!')
});

app.get('/channels', async (req, res) => {
    res.send(connected_channels)
});

app.listen(port, () => {
    console.log(`server started at ${port}`);
});
