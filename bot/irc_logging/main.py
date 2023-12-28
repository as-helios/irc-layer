import asyncio
import copy
import logging
import sys
import time
from datetime import timedelta, datetime

import httpx
import irc3
import pytz
from aiohttp import web
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from async_websocket_client.apps import AsyncWebSocketApp
from async_websocket_client.dispatchers import BaseDispatcher
from dotenv import load_dotenv
from irc3.plugins.asynchronious import Whois

from common import *
from custom import *

load_dotenv()
bot_type = "irc_logging"
log_file = "{}/logs/{}.log".format(os.getenv('DATA_FOLDER'), bot_type)
logging.basicConfig(
    format='%(asctime)s %(name)s %(levelname)s %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S',
    level=logging.INFO,
    handlers=[
        logging.FileHandler(log_file),
        logging.StreamHandler(sys.stdout)
    ]
)
logging.getLogger('apscheduler').setLevel(logging.ERROR)
bots = get_json_from_file("{}/config/irc/bots.json".format(os.getenv("DATA_FOLDER")), '{}')
ignore_masks = get_json_from_file("{}/config/irc/ignore.json".format(os.getenv("DATA_FOLDER")), '[]')
scheduler = AsyncIOScheduler(timezone=pytz.utc)
scheduler.start()
database = db.SessionLocal()


async def connect_websocket():
    while True:
        try:
            await client.run()
        except Exception:
            await asyncio.sleep(5)
        else:
            break


class WebsocketHandler(BaseDispatcher):
    async def on_connect(self):
        logging.info("Connected to ingest!")
        await self.ws.send(json.dumps({"api_key": os.getenv('API_KEY')}))
        self.is_running = True

    async def before_connect(self):
        logging.info("Trying to connect to ingest...")

    async def on_disconnect(self):
        logging.info("Lost connection with ingest!")
        self.is_running = False
        await connect_websocket()

    async def on_message(self, message: str):
        logging.info("WEBSOCKETS: {}".format(message))


client = AsyncWebSocketApp("ws{}://{}/irc/ws?api_key={}".format(os.getenv('SECURE'), os.getenv('INGEST_SERVER'), os.getenv('API_KEY')), WebsocketHandler())


@irc3.plugin
class BotPlugin(object):
    requires = [
        'irc3.plugins.core',
        'irc3.plugins.userlist',
        'irc3.plugins.autocommand'
    ]

    def __init__(self, context):
        self.bot = context
        self.log = context.log
        self.autojoin = context.config.channels
        self.db = db.SessionLocal()
        self.unknown_nicks = []
        self.oplist = {}
        self.voicelist = {}
        self.chanlist = {}

    def connection_made(self):
        db.logger.info(bot_type, "Connected")

    def server_ready(self):
        db.logger.info(bot_type, "Ready!")

    def connection_lost(self):
        db.logger.info(bot_type, "Disconnected")

    @irc3.event(irc3.rfc.RPL_TOPIC)
    async def topic_reply(bot, srv=None, me=None, channel=None, data=None):
        await db.edit_entries(database, "irc_channels", {"topic": data}, [["channel", "==", channel]])

    @irc3.event(irc3.rfc.RPL_NAMREPLY)
    async def names_reply(self, srv=None, me=None, m=None, channel=None, data=None):
        # fill irc_channels with the initial state
        if not (channel_id := await get_channel_id_from_name(self, channel)):
            db.logger.error(bot_type, "Channel does not exist in database: {}".format(channel))
            return
        if ' ' not in (data := data.strip()):
            users = [data]
        else:
            users = data.split(' ')
        for user in users:
            # add to db oplist or voicelist
            if user[0] in ('@', '+',):
                nick = user[1:]
            else:
                nick = user
            if not channel in self.chanlist:
                self.chanlist[channel] = []
            self.chanlist[channel].append(nick)
            # discover user in channel
            entry = {
                "hostname": None,
                "username": None,
                "userhost": None,
                "mask": "{}!?".format(nick),
                "nick": nick,
                "channel_id": channel_id
            }
            await edit_channel_userlist(self, channel_id, entry, '+')
            self.unknown_nicks.append(nick)
            # add to db oplist or voicelist
            channel_user = await db.get_entries(self.db, "irc_channel_users", [["nick", "==", nick]])
            if user[0] == '@' and channel_user:
                await edit_channel_status_list(self, channel_id, channel_user[-1].id, '+', 'op')
            elif user[0] == '+' and channel_user:
                await edit_channel_status_list(self, channel_id, channel_user[-1].id, '+', 'voice')

    @irc3.event(irc3.rfc.CONNECTED)
    async def connected(self, **kwargs):
        asyncio.create_task(connect_websocket())
        await db.remove_entries(self.db, "irc_channel_ops", amount=0)
        await db.remove_entries(self.db, "irc_channel_voices", amount=0)
        await db.remove_entries(self.db, "irc_channel_users", amount=0)
        await asyncio.sleep(11)
        for c in self.autojoin:
            logging.info("Joining {} ...".format(c))
            self.chanlist[c] = []
            self.bot.join(c)

    @irc3.event(irc3.rfc.PRIVMSG)
    async def on_privmsg(self, mask=None, event=None, target=None, data=None, tags=None):
        if target[0] != '#':
            data = data.split(' ')
            if len(data) == 1: return
            command = data[0]
            channel = "#" + data[1].lstrip('#')
            overrides = get_json_from_file("{}/config/irc/overrides.json".format(os.getenv("DATA_FOLDER")), '[]')
            if overrides and mask.nick in overrides and command in ('!join', '!part',):
                if command == '!join':
                    self.bot.join(channel)
                elif command == '!part':
                    self.bot.part(channel)
            return None
        if mask.nick == self.bot.nick or mask in ignore_masks: return
        payload = extract_user_details(mask)
        if not payload: return
        payload.update({
            "mask": mask,
            "target": target.strip() if target else None,
            "data": data.strip() if data else None,
            "tags": tags,
            "op": True if mask.nick in self.bot.channels[target].modes['@'] else False,
            "voice": True if mask.nick in self.bot.channels[target].modes['+'] else False,
            "created_at": datetime.utcnow().isoformat()
        })
        # scheduler.add_job(local_logging, args=[channel, format_message(payload)], trigger='date', run_date=datetime.utcnow(), replace_existing=False)
        if client.is_running:
            scheduler.add_job(websocket_request, args=[client, 'message', payload], trigger='date', run_date=datetime.utcnow(), replace_existing=False)
        else:
            scheduler.add_job(post_request, args=['message', payload], trigger='date', run_date=datetime.utcnow(), replace_existing=False)

    @irc3.event(irc3.rfc.JOIN_PART_QUIT)
    async def join_part_quit(self, mask=None, event=None, channel=None, data=None, tags=None):
        if mask in ignore_masks: return
        payload = extract_user_details(mask)
        if not payload: return
        # send to ingest server
        payload.update({
            "event_type": event,
            "mask": mask,
            "channel": channel,
            "content": data.strip() if data else None,
            "tags": tags,
            "created_at": datetime.utcnow().isoformat()
        })
        if channel not in self.chanlist.keys():
            self.chanlist[channel] = []
        if event in ("JOIN", "PART",):
            if event == "JOIN":
                self.chanlist[channel].append(mask.nick)
            elif event == "PART" and mask.nick in self.chanlist[channel]:
                self.chanlist[channel].remove(mask.nick)
            # scheduler.add_job(local_logging, args=[channel, format_message(payload)], trigger='date', run_date=datetime.utcnow(), replace_existing=False)
            if client.is_running:
                scheduler.add_job(websocket_request, args=[client, 'event', payload], trigger='date', run_date=datetime.utcnow(), replace_existing=False)
            else:
                scheduler.add_job(post_request, args=['event', payload], trigger='date', run_date=datetime.utcnow(), replace_existing=False)
        elif event == "QUIT":
            for c in self.chanlist.keys():
                if mask.nick in self.chanlist[c]:
                    self.chanlist[c].remove(mask.nick)
                    p = copy.deepcopy(payload)
                    p['channel'] = c
                    # scheduler.add_job(local_logging, args=[c, format_message(p)], trigger='date', run_date=datetime.utcnow(), replace_existing=False)
                    if client.is_running:
                        scheduler.add_job(websocket_request, args=[client, 'event', p], trigger='date', run_date=datetime.utcnow(), replace_existing=False)
                    else:
                        scheduler.add_job(post_request, args=['event', p], trigger='date', run_date=datetime.utcnow(), replace_existing=False)
        # await self.track_hostname_associations(details)
        # await self.track_userhost_associations(details)
        # await self.track_nick_associations(details)
        # get one or more channels
        if db_channels := db.to_list_of_dict(await db.get_entries(self.db, "irc_channels", [["channel", "==", channel]] if channel else [])):
            for db_channel in db_channels:
                db_channel_users = []
                if event != "JOIN":
                    db_channel_users = db.to_list_of_dict(await db.get_entries(self.db, "irc_channel_users", [["nick", "==", payload['nick']], ["channel_id", "==", db_channel['id']]]))
                # add/remove user from voicelist
                if db_channel_users and event != "JOIN" and (db_channel_ops := await db.get_entries(self.db, "irc_channel_voices", [["channel_user_id", "==", db_channel_users[-1]['id']], ["channel_id", "==", db_channel['id']]])):
                    await edit_channel_status_list(self, db_channel_ops[-1].channel_id, db_channel_ops[-1].channel_user_id, event, 'voice')
                # add/remove user from oplist
                if db_channel_users and event != "JOIN" and (db_channel_ops := await db.get_entries(self.db, "irc_channel_ops", [["channel_user_id", "==", db_channel_users[-1]['id']], ["channel_id", "==", db_channel['id']]])):
                    await edit_channel_status_list(self, db_channel_ops[-1].channel_id, db_channel_ops[-1].channel_user_id, event, 'op')
                # add/remove user from userlist
                if (db_channel_users and event != "JOIN") or event == "JOIN":
                    channel_user = copy.deepcopy(payload)
                    channel_user["channel_id"] = db_channel['id']
                    await edit_channel_userlist(self, db_channel['id'], channel_user, event)

    @irc3.event(irc3.rfc.NEW_NICK)
    async def new_nick(self, nick=None, new_nick=None, tags=None):
        if nick in ignore_masks: return
        payload = extract_user_details(nick)
        payload.update({
            "nick_old": payload['nick'],
            "nick_new": new_nick,
            "mask_old": payload['mask'],
            "mask_new": payload['mask'].replace(payload['nick'], new_nick),
            "tags": tags,
            "created_at": datetime.utcnow().isoformat()
        })
        for c in self.chanlist.keys():
            p = copy.deepcopy(payload)
            p['channel'] = c
            # if the new nick is already in the channel then send anyway
            if p['nick_old'] in self.chanlist[c] or p['nick_new'] in self.chanlist[c]:
                try:
                    self.chanlist[c].remove(p['nick_old'])
                except ValueError:
                    pass
                finally:
                    self.chanlist[c].append(p['nick_new'])
                    self.chanlist[c] = list(set(self.chanlist[c]))
                # scheduler.add_job(local_logging, args=[c, format_message(p)], trigger='date', run_date=datetime.utcnow(), replace_existing=False)
                if client.is_running:
                    scheduler.add_job(websocket_request, args=[client, 'nick', p], trigger='date', run_date=datetime.utcnow(), replace_existing=False)
                else:
                    scheduler.add_job(post_request, args=['nick', p], trigger='date', run_date=datetime.utcnow(), replace_existing=False)

        # update all user records that match for each channel
        payload['nick'] = payload['nick_new']
        payload['mask'] = payload['mask_new']
        await db.edit_or_write(self.db, "irc_channel_users", payload, [["nick", "==", payload['nick_old']]])
        await db.remove_entries(self.db, "irc_channel_users", [["nick", "==", payload['nick_old']]])

    @irc3.event(irc3.rfc.MODE)
    async def mode(self, mask=None, event=None, target=None, modes=None, data=None, tags=None):
        if mask in ignore_masks: return
        if target[0] != '#': return
        if mask.nick == bots[bot_type]['nick']: return
        logging.info(mask)
        details = extract_user_details(mask)
        if not details: return
        modes = sort_modes(modes.lstrip(':'))

        who = []
        if data:
            who = data.strip().split(' ')

        # solve for 1 operator with many flags
        if len(modes) == 1 and len(who) > 1:
            reorganize_modes = []
            for mode in modes:
                for action in mode.items():
                    for a in action[1]:
                        reorganize_modes.append({action[0]: [a]})
            modes = reorganize_modes

        # loop through operations and batch mode sets
        for i, mode in enumerate(modes):
            for action in mode.items():
                operation = action[0]
                modes_per_operation = action[1]
                payload = copy.deepcopy(details)
                payload.update({
                    "target": target.strip() if target else None,
                    "operation": operation,
                    "modes": modes_per_operation,
                    "data": who[i] if len(who) > 0 else None,
                    "tags": tags,
                    "created_at": datetime.utcnow().isoformat()
                })
                # scheduler.add_job(local_logging, args=[target, format_message(payload)], trigger='date', run_date=datetime.utcnow(), replace_existing=False)
                if client.is_running:
                    scheduler.add_job(websocket_request, args=[client, 'mode', payload], trigger='date', run_date=datetime.utcnow(), replace_existing=False)
                else:
                    scheduler.add_job(post_request, args=['mode', payload], trigger='date', run_date=datetime.utcnow(), replace_existing=False)

                # op or deop users
                if target[0] != '#': return
                db_channels = db.to_list_of_dict(await db.get_entries(self.db, "irc_channels", [["channel", "==", target]]))
                if db_channel_users := db.to_list_of_dict(await db.get_entries(self.db, "irc_channel_users", [["nick", "==", data], ["channel_id", "==", db_channels[-1]['id']]])):
                    for db_channel_user in db_channel_users:
                        if 'o' in modes_per_operation:
                            await edit_channel_status_list(self, db_channel_user['channel_id'], db_channel_user['id'], operation, 'op')
                        if 'v' in modes_per_operation:
                            await edit_channel_status_list(self, db_channel_user['channel_id'], db_channel_user['id'], operation, 'voice')

    @irc3.event(irc3.rfc.KICK)
    async def kick(self, mask=None, event=None, channel=None, target=None, data=None, tags=None):
        if channel not in self.chanlist.keys():
            self.chanlist[channel] = []
        if mask.nick in self.chanlist[channel] and mask.nick in self.chanlist[channel]:
            self.chanlist[channel].remove(mask.nick)
        if mask in ignore_masks: return
        payload = extract_user_details(mask)
        if not payload: return
        payload.update({
            "event_type": "KICK",
            "channel": channel,
            "content": target,
            "data": data.strip() if target != data else None,
            "tags": tags,
            "created_at": datetime.utcnow().isoformat()
        })
        # scheduler.add_job(local_logging, args=[channel, format_message(payload)], trigger='date', run_date=datetime.utcnow(), replace_existing=False)
        if client.is_running:
            scheduler.add_job(websocket_request, args=[client, 'event', payload], trigger='date', run_date=datetime.utcnow(), replace_existing=False)
        else:
            scheduler.add_job(post_request, args=['event', payload], trigger='date', run_date=datetime.utcnow(), replace_existing=False)

        db_channels = db.to_list_of_dict(await db.get_entries(self.db, "irc_channels", [["channel", "==", channel]]))
        if len(db_channels) == 0: return
        if db_channel_users := db.to_list_of_dict(await db.get_entries(self.db, "irc_channel_users", [["nick", "==", data], ["channel_id", "==", db_channels[-1]['id']]])):
            # remove user from voicelist
            for db_channel_user in db_channel_users:
                await edit_channel_status_list(self, db_channel_user['channel_id'], db_channel_user['id'], event, 'voice')
            # remove user from oplist
            for db_channel_user in db_channel_users:
                await edit_channel_status_list(self, db_channel_user['channel_id'], db_channel_user['id'], event, 'op')
            # remove user from userlist
            channel_user = copy.deepcopy(db_channel_users[-1])
            channel_user.update({
                "nick": target,
                "channel_id": db_channels[-1]['id']
            })
            await edit_channel_userlist(self, db_channels[-1]['id'], channel_user, event)

    @irc3.event(irc3.rfc.TOPIC)
    async def topic_changed(self, mask=None, channel=None, data=None, tags=None):
        if mask in ignore_masks: return
        payload = extract_user_details(mask)
        if not payload: return
        payload.update({
            "event_type": "TOPIC",
            "channel": channel,
            "content": data.strip() if data else None,
            "tags": tags,
            "created_at": datetime.utcnow().isoformat()
        })
        # scheduler.add_job(local_logging, args=[channel, format_message(payload)], trigger='date', run_date=datetime.utcnow(), replace_existing=False)
        if client.is_running:
            scheduler.add_job(websocket_request, args=[client, 'event', payload], trigger='date', run_date=datetime.utcnow(), replace_existing=False)
        else:
            scheduler.add_job(post_request, args=['event', payload], trigger='date', run_date=datetime.utcnow(), replace_existing=False)


def post_request(endpoint, data):
    try:
        r = httpx.post("http{}://{}/irc/{}".format(os.getenv('SECURE'), os.getenv("INGEST_SERVER"), endpoint), json=data, headers={"X-Api-Key": os.getenv("API_KEY")})
    except Exception as e:
        logging.error("ERROR: {}".format(json.dumps(data)))
        logging.error(e)
        scheduler.add_job(post_request, args=[endpoint, data], trigger='date', run_date=datetime.utcnow() + timedelta(seconds=1), replace_existing=False)
    else:
        if r.text == 'true':
            logging.info("ACCEPTED: {}".format(json.dumps(data)))
        # else:
        #     print("EXISTS: {}".format(json.dumps(data)))
    # print("ok")


async def websocket_request(client, line_type, data):
    match line_type:
        case "message":
            data.update({"table": "irc_log_messages"})
        case "mode":
            data.update({"table": "irc_log_modes"})
        case "event":
            data.update({"table": "irc_log_events"})
        case "nick":
            data.update({"table": "irc_log_nick_changes"})
        case other:
            return False
    try:
        await client.send(json.dumps(data))
    except Exception as e:
        logging.error("ERROR: {}".format(json.dumps(data)))
        logging.error(e)
        scheduler.add_job(websocket_request, args=[client, line_type, data], trigger='date', run_date=datetime.utcnow() + timedelta(seconds=1), replace_existing=False)


@irc3.plugin
class WebPlugin(object):
    def __init__(self, context):
        self.web = irc3.utils.maybedotted('aiohttp.web')
        self.bot = context
        self.whois = Whois(context)
        self.config = context.config.get(__name__, {})
        self.api_key = os.getenv("LOCAL_API_KEY")
        if not self.api_key:
            self.bot.log.warning('No web api_key is set. Your web service is insecure')
        # self.channels = context.config.autojoins
        self.server = None

    def server_ready(self):
        if self.server is None:
            server = self.web.Server(self.handler, loop=self.bot.loop)
            host = self.config.get('host', os.getenv("WEB_SERVER_HOST"))
            port = int(self.config.get('port', os.getenv("WEB_SERVER_PORT")))
            self.bot.log.info('Starting web interface on %s:%s...', host, port)
            self.server = self.bot.create_task(self.bot.loop.create_server(server, host, port))

    async def handler(self, req):
        if self.api_key != (api_key := req.headers.get('X-Api-Key')):
            await db.logger.warning(bot_type, "Bad API key {}".format(api_key))
            return web.Response(text='Sus', content_type='text/html', status=401)
        if req.method == 'GET':
            match req.path:
                case '/':
                    return web.Response(text='Hello world!', content_type='text/html', status=200)
                case other:
                    return web.Response(text='Not found', content_type='text/html', status=404)
        elif req.method == 'POST':
            try:
                data = await req.json()
            except ValueError:
                return web.Response(text="Invalid JSON data", status=400)
            # fix channel name
            if data['channel'][0] != '#':
                data['channel'] = "#{}".format(data['channel'])
            match req.path:
                case '/join':
                    try:
                        self.bot.join(data['channel'])
                    except Exception as e:
                        data.update({"error": str(e), "status": 400})
                        db.logger.error(str(e))
                    else:
                        await db.Channels(bot_type).add_to_db(data['channel'])
                        data.update({"success": 1, "status": 200})
                        db.logger.info(bot_type, "Joined {}".format(data['channel']))
                case '/part':
                    try:
                        self.bot.part(data['channel'])
                    except Exception as e:
                        data.update({"error": str(e), "status": 400})
                        db.logger.error(str(e))
                    else:
                        await db.Channels(bot_type).remove_from_db(data['channel'])
                        data.update({"success": 1, "status": 200})
                        db.logger.info(bot_type, "Parted {}".format(data['channel']))
                case other:
                    return web.Response(text='Not found', content_type='text/html', status=404)
            return web.json_response(data, status=data['status'], content_type='application/json', dumps=json.dumps)
        return self.web.Response()


def main():
    loop = asyncio.get_event_loop()
    while not (channels := asyncio.run(db.Channels(bot_type).list_db())):
        logging.info("Waiting for DB to respond with channels...")
        time.sleep(3)
    config = dict(
        channels=channels,
        autocommands="PRIVMSG NickServ :IDENTIFY {} {}".format(bots[bot_type]['password'], bots[bot_type]['nick']),
        nick=bots[bot_type]['nick'], realname=bots[bot_type]['nick'], username=bots[bot_type]['nick'].split('-of-')[1],
        host=bots[bot_type]['host'], port=bots[bot_type]['port'], ssl=bots[bot_type]['ssl'],
        timeout=30,
        includes=[
            'irc3.plugins.core',
            __name__,
        ],
        loop=loop
    )
    bot = irc3.IrcBot(**config)
    bot.include(WebPlugin)
    bot.run(forever=True)
    loop.run_forever()


if __name__ == '__main__':
    print("-" * 50)
    print("IRC Layer - Main Logging")
    print("-" * 50)
    logging.info("Start!!")
    main()
