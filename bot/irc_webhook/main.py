import asyncio
import logging
import sys
import time

import irc3
from aiohttp import web
from dotenv import load_dotenv

import db
from common import *

load_dotenv()
bot_type = "irc_webhook"
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
logging.getLogger('asyncio').setLevel(logging.CRITICAL)
logging.getLogger('irc3').setLevel(logging.DEBUG)
bots = get_json_from_file("{}/config/irc/bots.json".format(os.getenv("DATA_FOLDER")), '{}')
ignore_masks = get_json_from_file("{}/config/irc/ignore.json".format(os.getenv("DATA_FOLDER")), '[]')


@irc3.plugin
class BotPlugin(object):
    requires = [
        'irc3.plugins.core',
        'irc3.plugins.userlist',
        'irc3.plugins.command',
        'irc3.plugins.autocommand'
    ]

    def __init__(self, context):
        self.bot = context
        self.log = context.log
        self.autojoin = context.config.channels
        self.db = db.SessionLocal()
        self.settings = {}

    def connection_made(self):
        logging.info(message := "Connected")
        db.logger.info(bot_type, message)

    def server_ready(self):
        logging.info(message := "Ready!")
        db.logger.info(bot_type, message)
        if bots[bot_type]['password']:
            self.bot.privmsg("NickServ", "IDENTIFY {} {}".format(bots[bot_type]['password'], bots[bot_type]['nick']))

    def connection_lost(self):
        logging.info(message := "Disconnected")
        db.logger.info(bot_type, message)

    @irc3.event(irc3.rfc.CONNECTED, callback=None)
    async def connected(self, **kw):
        for settings in await db.get_entries(self.db, "settings"):
            self.settings[settings.key] = settings.value
        await asyncio.sleep(11)
        for c in self.autojoin:
            logging.info("Joining {} ...".format(c))
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
                case '/say':
                    try:
                        self.bot.privmsg(data['channel'], data['message'])
                    except Exception as e:
                        data.update({"error": str(e), "status": 400})
                        db.logger.error(str(e))
                    else:
                        data.update({"success": 1, "status": 200})
                        db.logger.info(bot_type, "Say \"{}\" in {}".format(data['channel'], data['message']))
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
    print("IRC Layer - Bot Webhook")
    print("-" * 50)
    main()
