import asyncio
import logging
import sys
import time

import irc3
from aiohttp import web
from dotenv import load_dotenv

from common import *
from custom import *

load_dotenv()
bot_type = "irc_antispam"
log_file = "{}/logs/{}.log".format(os.getenv('DATA_FOLDER'), bot_type)
logging.basicConfig(
    format='%(asctime)s %(name)s %(levelname)s %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S',
    level=logging.DEBUG,
    handlers=[
        logging.FileHandler(log_file),
        logging.StreamHandler(sys.stdout)
    ]
)
logging.getLogger('apscheduler').setLevel(logging.ERROR)
bots = get_json_from_file("{}/config/irc/bots.json".format(os.getenv("DATA_FOLDER")), '{}')
ignore_masks = get_json_from_file("{}/config/irc/ignore.json".format(os.getenv("DATA_FOLDER")), '[]')
antispam_delay = time.time() + 10


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
        self.settings = {}
        self.spam_filters = {
            "hostnames": {},
            "nicks": {},
            "hostmasks": {},
            "phrases": {}
        }
        self.flood_limit_character_threshold = 3

    @irc3.event(irc3.rfc.CONNECTED)
    async def connected(self, **kw):
        for settings in await db.get_entries(self.db, "settings"):
            self.settings[settings.key] = settings.value
        await asyncio.sleep(11)
        for c in self.autojoin:
            logging.info("Joining {} ...".format(c))
            self.bot.join(c)
        await refresh_spam_filters(self)
        if flood_limit_character_threshold := await get_db_settings(self, "flood_limit_character_threshold"):
            self.flood_limit_character_threshold = int(flood_limit_character_threshold)

    def connection_made(self):
        db.logger.info(bot_type, "Connected!")

    def server_ready(self):
        db.logger.info(bot_type, "Ready!")

    def connection_lost(self):
        db.logger.info(bot_type, "Disconnected!")

    @irc3.event(irc3.rfc.JOIN)
    async def on_join_auto_ops(self, mask=None, event=None, channel=None, data=None, tags=None):
        if mask.nick == self.bot.nick: return
        op_masks = get_json_from_file("{}/config/irc/op_masks.json".format(os.getenv("DATA_FOLDER")), '[]')
        if mask in op_masks:
            return self.bot.mode(channel, '+o', mask.nick)

    @irc3.event(irc3.rfc.JOIN)
    async def on_join_antispam(self, mask=None, event=None, channel=None, data=None, tags=None):
        if time.time() < antispam_delay: return
        if mask.nick == self.bot.nick: return
        details = extract_user_details(mask)
        if await is_nick_registered_op(self, details): return False
        kick, ban = False, False
        if not kick or not ban:
            # bad actor hostname
            hostname_offenses = await db.get_entries(self.db, "irc_hostname_offenses", [["hostname", "==", details['hostname']]])
            if hostname_offenses and hostname_offenses[-1].count >= int(await get_db_settings(self, "hostname_offense_limit_max")):
                kick, ban = True, True
        if not kick or not ban:
            # bad actor hostmask
            hostmask_offenses = await db.get_entries(self.db, "irc_hostmask_offenses", [["nick", "==", details['nick']], ["hostname", "==", details['hostname']]])
            if hostmask_offenses and hostmask_offenses[-1].count >= int(await get_db_settings(self, "hostmask_offense_limit_max")):
                kick, ban = True, True
        if not kick or not ban:
            lists = ('hostmasks', 'hostnames', 'nicks')
            details = extract_user_details(mask)
            for l in lists:
                if l == "hostmasks":
                    search_columns = ['nick', 'hostname']
                elif l == "hostnames":
                    search_columns = ['hostname']
                elif l == "nicks":
                    search_columns = ['nick']
                else:
                    continue
                for c in ('*', channel):
                    if c not in self.spam_filters[l].keys():
                        continue
                    for f in self.spam_filters[l][c]:
                        a, b = f, details
                        if match_banned_identity(a, b, search_columns, f['search_type']):
                            if await count_offense(self, details['nick'], details['hostname'], 1):
                                ban = True
                                if await count_offense(self, None, details['hostname'], 1):
                                    ban = True
                            kick = True
                            break
                if kick or ban:
                    break

        if not kick and not ban: return
        # move current channel to the start of the list
        channels = [channel] + self.autojoin[self.autojoin.index(channel):] + self.autojoin[:self.autojoin.index(channel)]
        for c in channels:
            if ban:
                self.bot.mode(c, "+b", "{}!*@{}".format(details['nick'], details['hostname']))
            if kick:
                self.bot.kick(c, details['nick'])

    @irc3.event(irc3.rfc.PRIVMSG)
    async def on_privmsg_antispam(self, mask=None, event=None, target=None, data=None, tags=None):
        if time.time() < antispam_delay: return
        if mask.nick == self.bot.nick or mask in ignore_masks: return
        # refresh spam filters if received a DM from the scepter
        overrides = get_json_from_file("{}/config/irc/overrides.json".format(os.getenv("DATA_FOLDER")), '[]')
        if overrides and data.strip() == "!refresh_spam_filters" and target == self.bot.nick and mask.nick in overrides:
            await refresh_spam_filters(self, )
            logging.info("Refreshed spam filters by {}".format(mask.nick))
            return self.bot.privmsg(mask.nick, "Refreshed spam filters.")
        # ignore dms
        if target[0] != '#': return
        details = extract_user_details(mask)
        if await is_nick_registered_op(self, details): return False
        kick, ban = False, False
        # check if cron jobs are running that help spam limiters decay
        if float(await get_db_settings(self, "cron_alive_timestamp")) + int(await get_db_settings(self, "cron_alive_timeout_seconds")) > time.time() and \
                (await get_db_settings(self, "flood_limit_enabled")).lower() in ("1", "on", "true"):
            # antiflood, kinda sucks
            if await flood_limit_check(self, mask.nick, data):
                kick = True
                if await count_offense(self, details['nick'], details['hostname'], 1):
                    ban = True
                    if await count_offense(self, None, details['hostname'], 1):
                        ban = True
        # spam filter phrases
        spam_filter_phrases = self.spam_filters['phrases']['*']
        if target in self.spam_filters['phrases'].keys():
            spam_filter_phrases += self.spam_filters['phrases'][target]
        for phrase in spam_filter_phrases:
            if match_banned_phrase(phrase['phrase'], data, phrase['search_type']):
                kick = True
                if await count_offense(self, details['nick'], details['hostname'], 1):
                    ban = True
                    if await count_offense(self, None, details['hostname'], 1):
                        ban = True

        if not kick and not ban: return
        # move current channel to the start of the list
        channels = [target] + self.autojoin[self.autojoin.index(target):] + self.autojoin[:self.autojoin.index(target)]
        for c in channels:
            if ban:
                self.bot.mode(c, "+b", "{}!*@{}".format(details['nick'], details['hostname']))
            if kick:
                self.bot.kick(c, details['nick'])


@irc3.plugin
class WebPlugin(object):
    def __init__(self, context):
        self.web = irc3.utils.maybedotted('aiohttp.web')
        self.bot = context
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
        logging.debug("Waiting for DB to respond with channels...")
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
    bot.run(forever=False)
    loop.run_forever()


if __name__ == '__main__':
    print("-" * 50)
    print("IRC Layer - Bot Antispam")
    print("-" * 50)
    logging.info("Start!!")
    main()
