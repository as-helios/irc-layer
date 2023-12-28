import copy
import logging
import sys
from datetime import datetime, timedelta

import irc3
from aiohttp import web
from cent import Client
from dotenv import load_dotenv
from irc3.plugins.asynchronious import Whois
from irc3.plugins.command import command
from sqlalchemy.event import listen

from common import *
from custom import *

load_dotenv()
bot_type = "irc_commands"
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
logging.getLogger('cent').setLevel(logging.ERROR)
bots = get_json_from_file("{}/config/irc/bots.json".format(os.getenv("DATA_FOLDER")), '{}')
ignore_masks = get_json_from_file("{}/config/irc/ignore.json".format(os.getenv("DATA_FOLDER")), '[]')
antispam_delay = time.time() + 10


def publish_to_pubsub(channels, message):
    if type(channels) is not list:
        channels = [channels]
    client = Client(os.getenv("CENTRIFUGO_API_URL"), api_key=os.getenv("CENTRIFUGO_API_KEY"), timeout=3)
    for c in channels:
        client.publish(c, message)


def send_to_pubsub(model, database, entry, *arg):
    line = entry.__dict__
    database = db.SessionLocal()
    match model.mapped_table:
        case "irc_banned_phrases":
            filters = [['content', line['search_type'], line['content']]]
        case "irc_banned_hostmasks":
            filters = [['nick', line['search_type'], line['nick']], ['hostname', line['search_type'], line['hostname']]]
        case "irc_banned_hostnames":
            filters = [['hostname', line['search_type'], line['hostname']]]
        case "irc_banned_nicks":
            filters = [['nick', line['search_type'], line['nick']]]
        case other:
            return None

    lines = {"irc_log_modes": [], "irc_log_events": [], "irc_log_nick_changes": [], 'irc_log_messages': db.get_entries_sync(database, "irc_log_messages", filters)}
    if model.mapped_table == "irc_log_prune_nicks":
        # this logic will explicity prune a nick's existance from the moement it is triggered to the beginning of time, then all is forgotten
        lines['irc_log_events'] = db.get_entries_sync(database, "irc_log_events", filters)
        lines['irc_log_modes'] = db.get_entries_sync(database, "irc_log_modes", filters)
        lines['irc_log_nick_changes'] = db.get_entries_sync(database, "irc_log_nick_changes", filters)
        for table in lines:
            for line in lines[table]:
                db.edit_entries_sync(database, table, {"pruned_at": datetime.utcnow()}, [["id", "==", line.id]])

    channels = {}
    for table in lines:
        line_type = table.split('_')[-1][:-1]
        for line in lines[table]:
            if line.channel not in channels.keys():
                channels[line.channel] = []
            for namespace in ("public", "$secret",):
                pubsub_channel = "{}:{}".format(namespace, line.channel)
                if line.channel not in channels.keys():
                    channels[pubsub_channel] = {line_type: []}
                channels[pubsub_channel][line_type].append(line.id)

    for pubsub_channel, line_type in channels.keys():
        for lines in line_type.items():
            publish_to_pubsub(pubsub_channel, {"dispatch": "prune", "ids": lines[1], "type": lines[0], "channel": "#{}".format(pubsub_channel.split(':')[1])})


listen(db.IRCLogNickPrune, "after_insert", send_to_pubsub)
listen(db.IRCBannedHostmasks, "after_insert", send_to_pubsub)
listen(db.IRCBannedHostnames, "after_insert", send_to_pubsub)
listen(db.IRCBannedNicks, "after_insert", send_to_pubsub)
listen(db.IRCBannedPhrases, "after_insert", send_to_pubsub)


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
        self.spam_filters = {
            "hostnames": [],
            "userhosts": [],
            "hostmasks": [],
            "phrases": []
        }
        self.whois = Whois(context)

    def connection_made(self):
        db.logger.info(bot_type, "Connected!")

    def server_ready(self):
        db.logger.info(bot_type, "Ready!")

    def connection_lost(self):
        db.logger.info(bot_type, "Disconnected!")

    @irc3.event(irc3.rfc.CONNECTED)
    async def connected(self, **kw):
        for settings in await db.get_entries(self.db, "settings"):
            self.settings[settings.key] = settings.value
        await asyncio.sleep(11)
        for c in self.autojoin:
            logging.info("Joining {} ...".format(c))
            self.bot.join(c)

    @irc3.event(irc3.rfc.PRIVMSG)
    async def on_privmsg_custom_commands(self, mask=None, event=None, target=None, data=None, tags=None):
        data = data.split(' ')
        if len(data) == 1: return
        command = data[0]
        if target[0] != '#':
            channel = "#" + data[1].lstrip('#')
            overrides = get_json_from_file("{}/config/irc/overrides.json".format(os.getenv("DATA_FOLDER")), '[]')
            if command in ('!join', '!part',) and mask.nick in overrides:
                if command == '!join':
                    self.bot.join(channel)
                elif command == '!part':
                    self.bot.part(channel)
                return
            # call custom command with variable args
            elif command in ('!kick', '!kick_ban', '!ban', '!unban',):
                """
                Multi target
                """
                if target != self.bot.nick: return  # dm only
                lines = data[1].split(',')
                actions = {"kick": [], "ban": [], "unban": []}
                for line in lines:
                    table, line_id = get_table_and_line_id_from_string(line)
                    if not table: return
                    line_db = await db.get_entries(self.db, table, [["id", "==", line_id]], 1)
                    line_db = copy.deepcopy(line_db.__dict__)
                    if mask.nick in self.bot.channels[line_db['channel']].modes['@']:
                        match command:
                            case '!kick':
                                if line_db['nick'] not in actions['kick'] and line_db['nick'] in self.bot.channels[line_db['channel']]:
                                    self.bot.kick(line_db['channel'], line_db['nick'])
                                    actions['kick'].append(line_db['nick'])
                            case '!ban':
                                if line_db['nick'] not in actions['ban']:
                                    self.bot.mode(line_db['channel'], "+b", "{}!*@{}".format(line_db['nick'], line_db['hostname']))
                                    actions['ban'].append(line_db['nick'])
                            case '!kick_ban':
                                if line_db['nick'] not in actions['ban']:
                                    self.bot.mode(line_db['channel'], "+b", "{}!*@{}".format(line_db['nick'], line_db['hostname']))
                                    actions['ban'].append(line_db['nick'])
                                if line_db['nick'] not in actions['kick'] and line_db['nick'] in self.bot.channels[line_db['channel']]:
                                    self.bot.kick(line_db['channel'], line_db['nick'])
                                    actions['kick'].append(line_db['nick'])
                            case '!unban':
                                if line_db['nick'] not in actions['unban']:
                                    self.bot.mode(line_db['channel'], "-b", "{}!*@{}".format(line_db['nick'], line_db['hostname']))
                                    actions['unban'].append(line_db['nick'])
                            case other:
                                return False
                db.logger.info("irc_commands", "{}: {} {}".format(mask.nick, command, data[1]), actions)
                return

            elif command in ('!prune', '!unprune', '!prune_hostmask', '!unprune_hostmask',):
                """
                Multi target
                """
                if target != self.bot.nick: return  # dm only
                lines = data[1].split(',')
                actions = {"prune": [], "unprune": [], "prune_hostmask": [], "unprune_hostmask": []}
                for line in lines:
                    table, line_id = get_table_and_line_id_from_string(line)
                    if not table: return
                    print(table)
                    line_db = await db.get_entries(self.db, table, [["id", "==", line_id]], 1)
                    line_db = copy.deepcopy(line_db.__dict__)
                    # channel_id = await get_channel_id_from_name(self, line[0].channel)
                    # if await self.is_nick_channel_op(channel_id, extract_user_details(mask)):
                    if mask.nick in self.bot.channels[line_db['channel'] if 'channel' in line_db else line_db['target']].modes['@'] and line_db['nick'] not in actions[command[1:]]:
                        timestamp = datetime.utcnow()
                        pruned = {}
                        if command in ('!prune_hostmask', '!unprune_hostmask',):
                            tables = [
                                # ["irc_log_events", [["nick", "==", line_db['nick']], ["hostname", "==", line_db['hostname']]]],
                                ["irc_log_messages", [["nick", "==", line_db['nick']], ["hostname", "==", line_db['hostname']]]],
                                # ["irc_log_modes", [["nick", "==", line_db['nick']], ["hostname", "==", line_db['hostname']]]],
                                # ["irc_log_nick_changes", [["nick_new", "==", line_db['nick']], ["hostname", "==", line_db['hostname']]]],
                                # ["irc_log_nick_changes", [["nick_old", "==", line_db['nick']], ["hostname", "==", line_db['hostname']]]]
                            ]
                            for table in tables:
                                # get a list of pruned lines to send to dispatcher
                                entries = await db.get_entries(self.db, table[0],  table[1])
                                for entry in entries:
                                    # save to pruned list
                                    line_type = get_line_type(table[0])
                                    if line_type not in pruned.keys():
                                        pruned[line_type] = []
                                    pruned[line_type].append(entry.id)
                                # mark lines with pruned_at timestamp up to 10 minutes before the targeted post
                                table[1].append(["created_at", ">=", line_db['created_at'] - timedelta(minutes=10)])
                                await db.edit_entries(self.db, table[0], {"pruned_at": timestamp if command == '!prune_hostmask' else None}, table[1], 0)
                        else:
                            # save to pruned list
                            line_type = get_line_type(table)
                            if line_type not in pruned.keys():
                                pruned[line_type] = []
                            pruned[line_type].append(line_id)
                            # mark lines with pruned_at timestamp
                            await db.edit_entries(self.db, table, {"pruned_at": timestamp if command == '!prune' else None}, [["id", "==", line_id]])
                        for line_type, line_ids in pruned.items():
                            dispatch_data = {"dispatch": "prune" if command.startswith("!prune") else "unprune", "ids": line_ids, "type": line_type, "channel": line_db['channel'] if 'channel' in line_db else line_db['target']}
                            publish_to_pubsub("{}:{}".format("$secret", line_db['channel'][1:]), dispatch_data)
                            publish_to_pubsub("{}:{}".format("public", line_db['channel'][1:]), dispatch_data)
                            actions[command[1:]].append(line_db['nick'])
                db.logger.info("irc_commands", "{}: {} {}".format(mask.nick, command, data[1]), actions)
                return

        # call any custom commands from the database
        if not command[0].isalnum() and command[0] in ('!', '$',):
            """
            Custom command/responses
            """
            logging.info("{} {} {}".format(target, command[0], ' '.join(data)[1:]))
            await custom_command_call(self, target, command[0], ' '.join(data)[1:])

    @irc3.event(irc3.rfc.JOIN)
    async def on_join_auto_ops(self, mask=None, event=None, channel=None, data=None, tags=None):
        if mask.nick == self.bot.nick: return
        op_masks = get_json_from_file("{}/config/irc/op_masks.json".format(os.getenv("DATA_FOLDER")), '[]')
        if mask in op_masks:
            return self.bot.mode(channel, '+o', mask.nick)
        details = extract_user_details(mask)
        if not await op_sanity_check(self, details): return
        channel_id = await get_channel_id_from_name(self, channel)
        nick_registered_id = await get_registered_id_from_nick(self, details['nick'])
        if await db.get_entries(self.db, "irc_nick_registered_ops", [["channel_id", "==", channel_id], ["nick_registered_id", "==", nick_registered_id]]):
            return self.bot.mode(channel, '+o', mask.nick)

    @command(show_in_help_list=False)
    async def admonish(self, mask=None, target=None, args=None):
        """Increases an op's admonishment count

            %%admonish <nick>
        """
        details = extract_user_details(mask)
        if await rate_limit_check(self, target if target != self.bot.nick else details['nick'], details): return
        if not await op_sanity_check(self, details): return
        # if await self.is_nick_channel_op(channel_id := await get_channel_id_from_name(self, target), details):
        if mask.nick in self.bot.channels[target].modes['@']:
            channel_id = await get_channel_id_from_name(self, target)
            # get the target registered nick to forgive, get the registered op row too
            if ((other_registered_nick_id := await get_registered_id_from_nick(self, args['<nick>'])) and
                    await db.get_entries(self.db, "irc_nick_registered_op", [["channel_id", "==", channel_id], ["nick_registered_id", "==", other_registered_nick_id]])):
                await count_admonish(self, other_registered_nick_id, 1)
                return self.bot.privmsg(target if target != self.bot.nick else mask.nick, "{} has been admonished.".format(args['<nick>']))
            else:
                return self.bot.privmsg(target if target != self.bot.nick else mask.nick, "Only op may be admonished.")

    @command(show_in_help_list=False)
    async def forgive(self, mask=None, target=None, args=None):
        """Reduces an op's admonishment count

            %%forgive <nick>
        """
        details = extract_user_details(mask)
        if await rate_limit_check(self, target if target != self.bot.nick else details['nick'], details): return
        if not await op_sanity_check(self, details): return
        if mask.nick.lower() == args['<nick>'].lower():
            return self.bot.privmsg(target if target != self.bot.nick else mask.nick, "You cannot forgive yourself. Feels bad man.")
        # if await self.is_nick_channel_op(channel_id := await get_channel_id_from_name(self, target), details):
        if mask.nick in self.bot.channels[target].modes['@']:
            channel_id = await get_channel_id_from_name(self, target)
            # get the target registered nick to forgive, get the registered op row too
            if other_registered_nick := await db.get_entries(self.db, "irc_nick_registered", [["nick", "==", args['<nick>']]]):
                if await db.get_entries(self.db, "irc_nick_registered_op", [["channel_id", "==", channel_id], ["nick_registered_id", "==", other_registered_nick[-1].id]]):
                    await count_admonish(self, other_registered_nick[-1].id, -1)
                    return self.bot.privmsg(target if target != self.bot.nick else mask.nick, "{} has been forgiven.".format(args['<nick>']))
                else:
                    await count_offense(self, other_registered_nick[-1].nick, other_registered_nick[-1].hostname, -1)
                    return self.bot.privmsg(target if target != self.bot.nick else mask.nick, "Only ops may be forgiven.")
            else:
                return self.bot.privmsg(target if target != self.bot.nick else mask.nick, "{} is not a registered nick.".format(args['<nick>']))

    @command(show_in_help_list=False)
    async def reserve(self, mask=None, target=None, args=None):
        """Reserve a nick for adjudication

            %%reserve <nick>
        """
        details = extract_user_details(mask)
        if await rate_limit_check(self, target if target != self.bot.nick else details['nick'], details): return
        if not await op_sanity_check(self, details): return
        if not await db.get_entries(self.db, "irc_nick_registered", [["nick", "==", args['<nick>']]]):
            entry = {
                "nick": args['<nick>'],
                "hash": None,
                "salt": None,
                "hostname": None,
                "username": None,
                "userhost": None,
                "mask": None,
                "abstain": False,
                "tags": [],
                "created_at": datetime.utcnow(),
                "updated_at": None
            }
            await db.write_entry(self.db, "irc_nick_registered", entry)
            return self.bot.privmsg(target if target != self.bot.nick else mask.nick, "{} is now reserved.".format(args['<nick>']))
        else:
            return self.bot.privmsg(target if target != self.bot.nick else mask.nick, "{} is already registered.".format(args['<nick>']))

    @command(public=False)
    async def register(self, mask=None, target=None, args=None):
        """Register command

            %%register <password>
        """
        details = extract_user_details(mask)
        # if await rate_limit_check(self, target if target != self.bot.nick else details['nick'], details): return
        # check if user already registered this nick
        if await db.get_entries(self.db, db_table := "irc_nick_registered", [["nick", "==", mask.nick], ["userhost", "==", details['userhost']]]):
            return self.bot.privmsg(mask.nick, "You already registered this nick!")
        # check if this nick has already been registered by someone else
        elif await db.get_entries(self.db, db_table, [["nick", "==", mask.nick]]):
            return self.bot.privmsg(mask.nick, "This nick is already registered by someone else")
        # check if userhost already has a registered nick
        elif await db.get_entries(self.db, db_table, [["userhost", "==", details['userhost']]]):
            return self.bot.privmsg(mask.nick, "You already have a different registered nick!")
        # check how many registered nicks does the hostname have, auto failed based on settings in db
        elif len(await db.get_entries(self.db, db_table, [["hostname", "==", details['hostname']]])) > int(self.settings['max_nicks_per_hostname']):
            return self.bot.privmsg(mask.nick, "This host has too many registered nicks! Contact an op for help.")
        # check if user has registered this nick too many times
        elif len(await db.get_entries(self.db, db_table, [["nick", "==", mask.nick], ["userhost", "==", details['userhost']]])) > 1:
            return self.bot.privmsg(mask.nick, "You already registered this nick too many times!")
        # check if nick is already reserved by having no mask and password
        elif len(await db.get_entries(self.db, db_table, [["nick", "==", mask.nick], ["mask", "is", None], ["hash", "is", None], ["salt", "is", None]])) > 1:
            return self.bot.privmsg(mask.nick, "This nick has been reserved! Ask for adjudication.")
        # check if password is too long
        elif len(args['<password>']) > 100:
            return self.bot.privmsg(mask.nick, "This password is too long!")
        else:
            if verify_hash(args['<password>'], salt := generate_salt(), hashed := generate_hash(args['<password>'], salt)):
                details.update({
                    "salt": salt,
                    "hash": hashed,
                    "abstain": False,
                    "tags": [],
                    "created_at": datetime.utcnow(),
                    "updated_at": None
                })
                await db.write_entry(self.db, db_table, details)
                return self.bot.privmsg(mask.nick, "You have successfully registered this nick!")
            else:
                db.logging.critical("Password hashing is broken!")
                return self.bot.privmsg(mask.nick, "Something broke registrations! Contact an op for help.")

    @command(public=False)
    async def identify(self, mask=None, target=None, args=None):
        """Identify command

            %%identify <password>
        """
        # ignore public channels
        if target[0] == '#': return
        details = extract_user_details(mask)
        if await rate_limit_check(self, target if target != self.bot.nick else details['nick'], details): return
        # check for registered nick that has already been claimed
        if registered_nick := await db.get_entries(self.db, db_table := "irc_nick_registered", [["nick", "==", mask.nick], ["hash", "is", None], ["salt", "is", None], ["mask", "is", None]]):
            # otherwise, verify the password is correct
            if verify_hash(args['<password>'], registered_nick[-1].salt, registered_nick[-1].hash):
                # check if user is already identified
                if registered_nick[-1].mask == mask:
                    return self.bot.privmsg(mask.nick, "You are already identified!")
                else:
                    registered_nick[-1].mask = details['mask']
                    registered_nick[-1].userhost = details['userhost']
                    registered_nick[-1].username = details['username']
                    registered_nick[-1].hostname = details['hostname']
                    registered_nick[-1].updated_at = datetime.utcnow()
                    await db.edit_entries(self.db, db_table, registered_nick[-1], [["nick", "==", mask.nick]])
                    return self.bot.privmsg(mask.nick, "You have been successfully identified!")
            else:
                # wrong password
                db.logging.info("{} failed to identify.".format(mask.nick))
                return self.bot.privmsg(mask.nick, "Incorrect password!")
        else:
            # registered nick not found
            return self.bot.privmsg(mask.nick, "You have not registered this nick!")

    @command(public=False)
    async def password(self, mask=None, target=None, args=None):
        """Sets a new password if you have your old password

            %%password <args>...
        """
        action = args['<args>'][0]
        if len(args['<args>']) > 1:
            password = args['<args>'][1]
        else:
            password = None
        details = extract_user_details(mask)
        if nick_registered := await db.get_entries(self.db, "irc_nick_registered", [["nick", "==", details['nick']], ["mask", "==", details['mask']]]):
            if action == "forget":
                nick_registered[-1].hash = None
                nick_registered[-1].salt = None
                await db.edit_entries(self.db, "irc_nick_registered", nick_registered[-1], [["id", "==", nick_registered[-1].id]])
                return self.bot.privmsg(mask.nick, "Password has been unset! You are still verified as long as your hostmask doesn't change.")
            elif action == "set" and password:
                if verify_hash(password, salt := generate_salt(), hashed := generate_hash(password, salt)):
                    nick_registered[-1].hash = hashed
                    nick_registered[-1].salt = salt
                    await db.edit_entries(self.db, "irc_nick_registered", nick_registered[-1], [["id", "==", nick_registered[-1].id]])
                    return self.bot.privmsg(mask.nick, "New password is set.")
                else:
                    db.logging.critical("Password hashing is broken!")
                    return self.bot.privmsg(mask.nick, "Something broke registrations! Contact an op for help.")
            else:
                return self.bot.privmsg(mask.nick, "Specify a password to set")
        else:
            return self.bot.privmsg(mask.nick, "You haven't registered yet.")

    @command(show_in_help_list=False)
    async def op(self, mask=None, target=None, args=None):
        """Registered op command

            %%op <args>...
        """
        if target[0] != '#': return
        details = extract_user_details(mask)
        if await rate_limit_check(self, target if target != self.bot.nick else details['nick'], details): return
        if not await op_sanity_check(self, details): return
        # allow first registered nick to bypass sanity checks
        nick_registered = await db.get_entries(self.db, "irc_nick_registered", [["nick", "==", mask.nick], ["mask", "==", mask]])
        if not nick_registered or (nick_registered[-1].id != 1 and not await op_sanity_check(self, details)): return
        channel_id = await get_channel_id_from_name(self, target)
        action = args['<args>'][0].lower()
        nick = args['<args>'][1]
        # execute commands
        if len(args['<args>']) > 1 and action == "me" and nick.lower() == "now":
            nick_registered_op = await db.get_entries(self.db, "irc_nick_registered_ops", [["nick_registered_id", "==", nick_registered[-1].id], ["channel_id", "==", channel_id]])
            channel_user = await db.get_entries(self.db, "irc_channel_users", [["nick", "==", mask.nick], ["channel_id", "==", channel_id]])
            channel_user_ops = await db.get_entries(self.db, "irc_channel_ops", [["channel_user_id", "==", channel_user[-1].id], ["channel_id", "==", channel_id]])
            # user is a registered op but not seen as a channel op yet
            if nick_registered_op and not channel_user_ops:
                # get the channel user entry to reference for channel op
                if await db.get_entries(self.db, "irc_channel_users", [["nick", "==", mask.nick], ["channel_id", "==", channel_id]]):
                    self.bot.mode(target, '+o', mask.nick)
                else:
                    # bot is retarded and can't see the user
                    return self.bot.privmsg(target, "Bot can't see nick? Rekt?")
            elif not nick_registered_op:
                # genesis op
                if nick_registered[-1].id == 1:
                    self.bot.mode(target, '+o', mask.nick)
                    await db.write_entry(self.db, "irc_nick_registered_ops", {"channel_id": channel_id, "nick_registered_id": nick_registered[-1].id, "created_at": datetime.utcnow()})
                    self.bot.privmsg(target, "{} has been added to auto ops".format(mask.nick))
                # user is not a registered op and can't use the "!op me now" command
                return
            else:
                # user is already a channel op and is a registered op
                return self.bot.privmsg(target, "You are already an op!")

        # op user if they are already on auto op
        if len(args['<args>']) == 1 and action == "me":
            if not (target_channel_user := await db.get_entries(self.db, "irc_channel_users", [["nick", "==", nick], ["channel_id", "==", channel_id]])):
                return self.bot.privmsg(target, "Bot can't see nick. Rekt?".format(target_channel_user[-1].nick))
            if not (target_nick_registered := await db.get_entries(self.db, "irc_nick_registered", [["nick", "==", nick], ["mask", "==", target_channel_user[-1].mask]])):
                return self.bot.privmsg(target, "{} must be registered and identified to be added to op.".format(target_nick_registered[-1].nick))
            if await db.get_entries(self.db, "irc_nick_registered_ops", [["nick_registered_id", "==", target_nick_registered[-1].id], ["channel_id", "==", channel_id]]):
                return self.bot.mode(target, '+o', target_nick_registered[-1].nick)

        # op related commands
        if action in ("add", "remove"):
            # check if bot restarted recently, run whois if nick is unknown
            if await check_if_nick_is_unknown(self, nick):
                return self.bot.privmsg(target, "Channel user is missing details. Whois timed out.")
            if not (target_channel_user := await db.get_entries(self.db, "irc_channel_users", [["nick", "==", nick], ["channel_id", "==", channel_id]])):
                return self.bot.privmsg(target, "Bot can't see nick. Rekt?".format(nick))
            if not (target_nick_registered := await db.get_entries(self.db, "irc_nick_registered", [["nick", "==", nick], ["mask", "==", target_channel_user[-1].mask]])):
                return self.bot.privmsg(target, "{} must be registered and identified to be added to op.".format(nick))
            target_nick_registered_op = await db.get_entries(self.db, "irc_nick_registered_ops", [["nick_registered_id", "==", target_nick_registered[-1].id], ["channel_id", "==", channel_id]])
            match action:
                case "add":
                    # check if registered nick matches the channel user's mask
                    if not target_nick_registered_op and await db.get_entries(self.db, "irc_channel_users", [["nick", "==", target_nick_registered[-1].nick], ["channel_id", "==", channel_id]]):
                        # add user to registered ops
                        self.bot.mode(target, '+o', target_nick_registered[-1].nick)
                        await db.write_entry(self.db, "irc_nick_registered_ops", {"channel_id": channel_id, "nick_registered_id": target_nick_registered[-1].id, "created_at": datetime.utcnow()})
                        return self.bot.privmsg(target, "{} has been added to auto ops".format(target_nick_registered[-1].nick))
                    elif target_nick_registered_op:
                        self.bot.mode(target, '+o', target_nick_registered[-1].nick)
                        return self.bot.privmsg(target, "{} is already auto op'd here".format(target_nick_registered[-1].nick, target))
                    else:
                        # bot is retarded and can't see the user
                        return self.bot.privmsg(target, "Bot can't see nick? Rekt?")
                case "remove":
                    # check if nick is a registered op
                    if not target_nick_registered_op:
                        return self.bot.privmsg(target, "{} is not a registered op for {}.".format(target_nick_registered[-1].nick, target))
                    filters = [["nick_registered_id", "==", target_nick_registered[-1].id], ["channel_id", "==", channel_id]]
                    if await db.get_entries(self.db, "irc_nick_registered_ops", filters):
                        self.bot.mode(target, '-o', target_nick_registered[-1].nick)
                        await db.remove_entries(self.db, "irc_nick_registered_ops", filters)
                        return self.bot.privmsg(target, "{} has been removed from auto ops".format(target_nick_registered[-1].nick))
                    else:
                        return self.bot.privmsg(target, "{} is not op'd".format(target_nick_registered[-1].nick))

    @command(show_in_help_list=False)
    async def prune_many(self, mask=None, target=None, args=None):
        """Hides log entries based on hostmask

            %%prune_many <args>...
        """
        details = extract_user_details(mask)
        if await rate_limit_check(self, target if target != self.bot.nick else details['nick'], details): return
        if not await op_sanity_check(self, details): return
        nick = args['<args>'][0]
        hostname = args['<args>'][1]
        timestamp = datetime.utcnow()
        await db.edit_entries(self.db, "irc_log_events", {"pruned_at": timestamp}, [["nick", "==", nick], ["hostname", "==", hostname]], 0)
        await db.edit_entries(self.db, "irc_log_messages", {"pruned_at": timestamp}, [["nick", "==", nick], ["hostname", "==", hostname]], 0)
        await db.edit_entries(self.db, "irc_log_modes", {"pruned_at": timestamp}, [["nick", "==", nick], ["hostname", "==", hostname]], 0)
        await db.edit_entries(self.db, "irc_log_nick_changes", {"pruned_at": timestamp}, [["nick_new", "==", nick], ["hostname", "==", hostname]], 0)
        await db.edit_entries(self.db, "irc_log_nick_changes", {"pruned_at": timestamp}, [["nick_old", "==", nick], ["hostname", "==", hostname]], 0)
        return self.bot.privmsg(target if target != self.bot.nick else mask.nick, "{}!.*@{} has been pruned from the logs.".format(nick, hostname))

    @command(show_in_help_list=False)
    async def unprune_many(self, mask=None, target=None, args=None):
        """Unhides log entries based on hostmask

            %%unprune_many <args>...
        """
        details = extract_user_details(mask)
        if await rate_limit_check(self, target if target != self.bot.nick else details['nick'], details): return
        if not await op_sanity_check(self, details): return
        nick = args['<args>'][0]
        hostname = args['<args>'][1]
        await db.edit_entries(self.db, "irc_log_events", {"pruned_at": None}, [["nick", "==", nick], ["hostname", "==", hostname]], 0)
        await db.edit_entries(self.db, "irc_log_messages", {"pruned_at": None}, [["nick", "==", nick], ["hostname", "==", hostname]], 0)
        await db.edit_entries(self.db, "irc_log_modes", {"pruned_at": None}, [["nick", "==", nick], ["hostname", "==", hostname]], 0)
        await db.edit_entries(self.db, "irc_log_nick_changes", {"pruned_at": None}, [["nick_new", "==", nick], ["hostname", "==", hostname]], 0)
        await db.edit_entries(self.db, "irc_log_nick_changes", {"pruned_at": None}, [["nick_old", "==", nick], ["hostname", "==", hostname]], 0)
        return self.bot.privmsg(target if target != self.bot.nick else mask.nick, "{}!.*@{} has been restored to the logs.".format(nick, hostname))

    @command(show_in_help_list=False)
    async def adjudicate(self, mask=None, target=None, args=None):
        """Sets a nick's mask to whichever nick is registered without a password (reserved)

            %%adjudicate <nick>
        """
        details = extract_user_details(mask)
        if await rate_limit_check(self, target if target != self.bot.nick else details['nick'], details): return
        if not await op_sanity_check(self, details): return
        # check if nick has unknown hostmask, fetch it with whois
        if await check_if_nick_is_unknown(self, args['<nick>']):
            return self.bot.privmsg(target if target != self.bot.nick else mask.nick, "Channel user is missing details. Whois timed out.")
        # get channel user from epehemeral table with the whois information
        if channel_user := await db.get_entries(self.db, "irc_channel_users", [["nick", "==", args['<nick>']], ["mask", "is", None]]):
            # check if the nick is registered
            if not (target_nick_registered := await db.get_entries(self.db, "irc_nick_registered", [["nick", "==", args['<nick>']]])):
                return self.bot.privmsg(target, "Nick is not registered.")

            # check if the mask already matches, no adjudication needed
            if target_nick_registered[-1].mask == channel_user[-1].mask:
                return self.bot.privmsg(target if target != self.bot.nick else mask.nick, "Nick already matches the hostmask. No adjudication needed.")
            # prepare entry for nick registered overwrite
            entry = {
                "nick": channel_user[-1].nick,
                "mask": channel_user[-1].mask,
                "hash": None,
                "salt": None,
                "hostname": None,
                "username": None,
                "userhost": None,
                "abstain": False,
                "tags": [],
                "created_at": (timestamp := datetime.utcnow()),
                "updated_at": timestamp
            }
            await db.edit_entries(self.db, "irc_nick_registered", entry, [["nick", "==", entry['nick']]])
            # break registered wallet connection
            nick_registered = await db.get_entries(self.db, "irc_nick_registered", [["nick", "==", entry['nick']], ["mask", "==", entry['mask']]])
            await db.edit_entries(self.db, "irc_nick_registered_wallets", {"nick_registered_id": None}, [["nick_registered_id", "==", nick_registered[-1].id]])
            # TODO: test disconnect of a wallet later
            # remove all assigned op positions if they exist
            await db.remove_entries(self.db, "irc_nick_registered_ops", {"nick_registered_id": nick_registered[-1].id})
            # TODO: test deletion of registered ops
            return self.bot.privmsg(target if target != self.bot.nick else mask.nick, "{} has been adjudicated.".format(entry['nick']))
        else:
            return self.bot.privmsg(target if target != self.bot.nick else mask.nick, "{} doesn't seem to be online.".format(args['<nick>']))

    @command(show_in_help_list=False)
    async def tags(self, mask=None, target=None, args=None):
        """Tags command

            %%tags <nick>
        """
        details = extract_user_details(mask)
        if await rate_limit_check(self, mask.nick, details['nick']): return
        if not await op_sanity_check(self, details): return
        channel_id = await get_channel_id_from_name(self, target)
        if not (channel_user := await db.get_entries(self.db, "irc_channel_users", [["nick", "==", args['<nick>']], ["channel_id", "==", channel_id]])):
            return self.bot.privmsg(mask.nick, "Bot can't see nick. Rekt?".format(channel_user[-1].nick))
        if not (nick_registered := await db.get_entries(self.db, "irc_nick_registered", [["nick", "==", args['<nick>']], ["mask", "==", channel_user[-1].mask]])):
            return self.bot.privmsg(mask.nick, "{} isn't a registered nick.".format(nick_registered[-1].nick))
        return self.bot.privmsg(mask.nick, "Tags for {}: {}".format(args['<nick>'], json.dumps(nick_registered[-1].tags)))

    @command(show_in_help_list=False)
    async def tag(self, mask=None, target=None, args=None):
        """Tag command

            %%tag <nick> <tag>
        """
        details = extract_user_details(mask)
        if await rate_limit_check(self, target if target != self.bot.nick else mask.nick, details): return
        if not await op_sanity_check(self, details): return
        tag = args['<tag>'].upper()
        nick_registered = await db.get_entries(self.db, "irc_nick_registered", [["nick", "==", mask.nick, "mask", "==", mask]])
        if nick_registered[-1].id != 1 and "S" not in nick_registered[-1].tags:
            return self.bot.privmsg(target if target != self.bot.nick else mask.nick, "You must be ordained to run this command.")
        # checks if nick is registered and an op in at least 1 channel
        target_nick_registered = await db.get_entries(self.db, "irc_nick_registered", [["nick", "==", args['<nick>']]])
        if target_nick_registered and await db.get_entries(self.db, "irc_nick_registered_ops", [["nick_registered_id", "==", target_nick_registered[-1].id]]):
            # must cast as a list because it returns some kind of funky list that doesn't save
            target_nick_registered[-1].tags = list(target_nick_registered[-1].tags)
            # adds the "super" tag to the registered nick, activated when they are op'd
            if tag not in target_nick_registered[-1].tags:
                target_nick_registered[-1].tags.append(tag)
                target_nick_registered[-1].updated_at = datetime.utcnow()
                added = True
            else:
                target_nick_registered[-1].tags.remove(tag)
                target_nick_registered[-1].updated_at = datetime.utcnow()
                added = False
            nick = target_nick_registered[-1].nick
            await db.edit_entries(self.db, "irc_nick_registered", target_nick_registered[-1], [["nick", "==", target_nick_registered[-1].nick]])
            return self.bot.privmsg(target if target != self.bot.nick else mask.nick, "{} is {} tagged with \"{}\".".format(nick, "now" if added else "no longer", tag))
        else:
            return self.bot.privmsg(target if target != self.bot.nick else mask.nick, "{} is not an op".format(args['<nick>']))

    @command(show_in_help_list=False)
    async def antispam(self, mask=None, target=None, args=None):
        """Antispam command

            %%antispam <args>...
        """
        details = extract_user_details(mask)
        if await rate_limit_check(self, target if target != self.bot.nick else details['nick'], details): return
        if not await op_sanity_check(self, details): return
        nick_registered = await db.get_entries(self.db, "irc_nick_registered", [["nick", "==", mask.nick], ["mask", "==", mask]])
        if nick_registered[-1].id != 1 and "AS" not in nick_registered[-1].tags:
            return self.bot.privmsg(target if target != self.bot.nick else mask.nick, "You must be ordained to run this command.")
        entry_types = ("hostname", "hostmask", "nick", "phrase",)
        channel_id = None
        channel = None
        entry_id = None
        # search_types = ("string", "regex")
        if len(args['<args>']) < 3: return
        action = args['<args>'][0].lower()
        entry_type = args['<args>'][1].lower()
        if entry_type not in entry_types:
            return self.bot.privmsg(target if target != self.bot.nick else mask.nick, "Invalid entry type ({})".format(entry_type))
        if action in ("list", "add"):
            channel = args['<args>'][2].lower()
            if channel != '*':
                channel_id = await get_channel_id_from_name(self, channel)
        elif action in ("remove", "disable", "enable",):
            entry_id = args['<args>'][2]
            if not entry_id.isnumeric():
                return self.bot.privmsg(target if target != self.bot.nick else mask.nick, "{} is not numeric.".format(entry_id))
            if len(args['<args>']) < 3:
                return self.bot.privmsg(target if target != self.bot.nick else mask.nick, "Not enough arguments.")
        if not channel and action not in ("remove", "disable", "enable"):
            return self.bot.privmsg(target if target != self.bot.nick else mask.nick, "Specify a channel to search.")
        # execute command request
        if action == "list":
            if not (entries := await db.get_entries(self.db, "irc_banned_{}s".format(entry_type), [["channel_id", "==", int(channel_id) if channel_id else channel_id]])):
                return self.bot.privmsg(target if target != self.bot.nick else mask.nick, "No filters for this category/channel.")
            for entry in entries:
                channel_name = await get_channel_name_from_id(self, entry.channel_id)
                active_status = " [🛑]" if entry.disabled else " [✔️]"
                if entry_type == ("host", "hostname"):
                    message = "[ID: {}] {}, {}, {}: {}{}".format(entry.id, channel_name if channel_name else 'All channels', entry_type, entry.search_type, getattr(entry, "hostname"), active_status)
                elif entry_type == "hostmask":
                    message = "[ID: {}] {}, {}, {}: {} @ {}{}".format(entry.id, channel_name if channel_name else 'All channels', entry_type, entry.search_type, getattr(entry, "nick"), getattr(entry, "hostname"),
                                                                      active_status)
                elif entry_type in ("nick", "nickname"):
                    message = "[ID: {}] {}, {}, {}: {}{}".format(entry.id, channel_name if channel_name else 'All channels', entry_type, entry.search_type, getattr(entry, "nick"), active_status)
                elif entry_type == "phrase":
                    message = "[ID: {}] {}, {}, {}: {}{}".format(entry.id, channel_name if channel_name else 'All channels', entry_type, entry.search_type, getattr(entry, "phrase"), active_status)
                else:
                    continue
                self.bot.privmsg(target if target != self.bot.nick else mask.nick, message)
                time.sleep(1)
        elif action in ("remove", "disable", "enable",):
            if (entry := await db.get_entries(self.db, "irc_banned_{}s".format(entry_type), [["id", "==", entry_id]])) and entry[-1] != (None,):
                entry = entry[-1].__dict__
                if action == "remove":
                    await db.remove_entries(self.db, "irc_banned_{}s".format(entry_type), [["id", "==", entry_id]])
                elif action in ("disable", "enable"):
                    await db.edit_entries(self.db, "irc_banned_{}s".format(entry_type), {"disabled": True if action == "disable" else False}, [["id", "==", entry['id']]])
                if 'nick' in entry.keys() and 'hostname' in entry.keys():
                    message = "{}d {} spam filter ID {}: {} @ {}".format(action.capitalize(), entry_type, entry['id'], entry['nick'], entry['hostname'])
                elif 'nick' in entry.keys() and 'hostname' not in entry.keys():
                    message = "{}d {} spam filter ID {}: {}".format(action.capitalize(), entry_type, entry['id'], entry['nick'])
                elif 'nick' not in entry.keys() and 'hostname' in entry.keys():
                    message = "{}d {} spam filter ID {}: {}".format(action.capitalize(), entry_type, entry['id'], entry['hostname'])
                elif 'phrase' in entry.keys():
                    message = "{}d {} spam filter ID {}: {}".format(action.capitalize(), entry_type, entry['id'], entry['phrase'])
                else:
                    message = "Something went wrong."
                self.bot.privmsg(target if target != self.bot.nick else mask.nick, message)
                return self.bot.privmsg("Bow-of-Artemis", "!refresh_spam_filters")
            else:
                return self.bot.privmsg(target if target != self.bot.nick else mask.nick, "Antispam filter ID {} is not found in the database".format(entry_id))
        elif action in ("add",):
            if not channel_id: return
            if len(args['<args>']) < 5:
                return self.bot.privmsg(target if target != self.bot.nick else mask.nick, "Not enough arguments.")
            search_type = args['<args>'][3]
            query = args['<args>'][4:]
            if len(args['<args>']) == 6:
                query = args['<args>'][4]
                query2 = args['<args>'][5]
            elif len(args['<args>']) == 5:
                query = args['<args>'][4]
                query2 = None
            else:
                query = ' '.join(query)
                query2 = None
            # form the entry
            entry = {
                "channel_id": channel_id if channel_id and channel != '*' else None,
                "search_type": search_type,
                "disabled": False,
                "created_at": datetime.utcnow(),
                "pruned_at": None,
                "updated_at": datetime.utcnow()
            }
            # check if filter is too powerful, too many wild regexes
            too_powerful = []
            for r in ("+", "*"):
                for r2 in ("[\w]", "[\w\W]", "[\d\D]", ".", "[a-zA-Z0-9]", "[a-zA-Z]"):
                    too_powerful.append("{}{}".format(r2, r))
            if search_type == "regex" and query in too_powerful and ((query2 and query2 in too_powerful) or not query2):
                return self.bot.privmsg(target if target != self.bot.nick else mask.nick, "This filter might be too powerful")
            # form the rest of the entry
            if entry_type == "hostname":
                entry.update({
                    "hostname": query
                })
                filters = entry['hostname']
            elif entry_type == "hostmask":
                entry.update({
                    "nick": query,
                    "hostname": query2
                })
                filters = "{} @ {}".format(entry['nick'], entry['hostname'])
            elif entry_type == "nick":
                entry.update({
                    "nick": query
                })
                filters = entry['nick']
            elif entry_type == "phrase":
                entry.update({
                    "phrase": query
                })
                filters = entry['phrase']
            else:
                return
            await db.write_entry(self.db, "irc_banned_{}s".format(entry_type), entry)
            self.bot.privmsg(target if target != self.bot.nick else mask.nick, "Added spam filter for {}, {}, {}: {}".format(channel if channel != '*' else 'all channels', entry_type, search_type, filters))
            return self.bot.privmsg("Bow-of-Artemis", "!refresh_spam_filters")

    @command(show_in_help_list=False)
    async def custom(self, mask=None, target=None, args=None):
        """Custom command

            %%custom <args>...
        """
        # !custom add/edit/remove command prefix response
        # TODO: need a list command
        details = extract_user_details(mask)
        if await rate_limit_check(self, target if target != self.bot.nick else details['nick'], details): return
        if not await op_sanity_check(self, details): return
        if target[0] != '#': return
        # TODO: change this so the command can specify 1 or any channel
        if len(args['<args>']) < 2: return
        action = args['<args>'][0].lower()
        command = args['<args>'][1].lower()
        if (prefix := command[0]) and prefix.isalnum():
            return self.bot.privmsg(target if target != self.bot.nick else mask.nick, "Prefix must be a symbol")
        entry = {"command": command[1:], "prefix": command[0], "channel": target}
        response = args['<args>'][2:] if len(args['<args>']) > 2 else None
        if action in ("edit", "add") and (custom_command := await db.get_entries(self.db, "irc_custom_commands", [[key, "==", entry[key]] for key in entry.keys()])):
            custom_command[-1].response = ' '.join(response)
            custom_command[-1].updated_at = datetime.utcnow()
            await db.edit_entries(self.db, "irc_custom_commands", custom_command[-1], [[key, "==", entry[key]] for key in entry.keys()])
            return self.bot.privmsg(target if target != self.bot.nick else mask.nick, "Response changed for {}".format(command))
        elif action == "add":
            entry.update({
                "channel": target,
                "response": ' '.join(response),
                "disabled": False,
                "updated_at": datetime.utcnow()
            })
            await db.write_entry(self.db, "irc_custom_commands", entry)
            return self.bot.privmsg(target if target != self.bot.nick else mask.nick, "Response set for {}".format(command))
        elif action == "remove":
            entry.update({
                "channel": target
            })
            await db.remove_entries(self.db, "irc_custom_commands", entry)
            return self.bot.privmsg(target if target != self.bot.nick else mask.nick, "Removed the command for {}".format(command))

    @command(public=False, show_in_help_list=False)
    async def settings(self, mask=None, target=None, args=None):
        """Settings log entries based on hostmask

            %%settings <args>...
        """
        details = extract_user_details(mask)
        if await rate_limit_check(self, target if target != self.bot.nick else details['nick'], details): return
        if not await op_sanity_check(self, details): return
        nick_registered = await db.get_entries(self.db, "irc_nick_registered", [["nick", "==", mask.nick], ["mask", "==", mask]])
        if nick_registered[-1].id != 1 and "S" not in nick_registered[-1].tags: return
        key = args['<args>'][0]
        value = args['<args>'][1:]
        if settings := await db.get_entries(self.db, "settings", [["key", "==", key]]):
            settings[-1].value = ' '.join(value)
            await db.edit_entries(self.db, "irc_log_events", settings[-1], [["id", "==", settings[-1].id]])
            return self.bot.privmsg(target if target != self.bot.nick else mask.nick, "Settings updated for \"{}\" to {}".format(key, ' '.join(value)))
        else:
            return self.bot.privmsg(target if target != self.bot.nick else mask.nick, "Settings not found for \"{}\"".format(key))

    @command(show_in_help_list=False)
    async def absolve(self, mask=None, target=None, args=None):
        """Absolve hostmask or hostname offenses

            %%absolve <args>...
        """
        details = extract_user_details(mask)
        if await rate_limit_check(self, target if target != self.bot.nick else details['nick'], details): return
        if not await op_sanity_check(self, details): return
        if len(args['<args>']) == 1:
            hostname = args['<args>'][0]
            nick = None
            filters = {"hostname": hostname}
        else:
            hostname = args['<args>'][0]
            nick = args['<args>'][1]
            filters = {"nick": nick, "hostname": hostname}
        if offender := await db.get_entries(self.db, "irc_hostmask_offenses" if nick else "irc_hostname_offenses", [[key, "==", filters[key]] for key in filters.keys()]):
            erase_count = offender[-1].count
            await db.remove_entries(self.db, "irc_hostmask_offenses" if nick else "irc_hostname_offenses", {"id": offender[-1].id})
            return self.bot.privmsg(target if target != self.bot.nick else mask.nick, "{} has been absolved of {} offenses.".format(nick if nick else hostname, erase_count))
        elif len(args['<args>']) == 1:
            return self.bot.privmsg(target if target != self.bot.nick else mask.nick, "No offenses found for hostname {}".format(hostname))
        else:
            return self.bot.privmsg(target if target != self.bot.nick else mask.nick, "{} from {} hasn't offended.".format(nick, hostname))

    @command(show_in_help_list=False)
    async def offenses(self, mask=None, target=None, args=None):
        """Offenses hostmask or hostname offenses

            %%offenses <args>...
        """
        details = extract_user_details(mask)
        if await rate_limit_check(self, target if target != self.bot.nick else details['nick'], details): return
        if len(args['<args>']) == 1:
            hostname = args['<args>'][0]
            nick = None
            filters = {"hostname": hostname}
        else:
            hostname = args['<args>'][0]
            nick = args['<args>'][1]
            filters = {"nick": nick, "hostname": hostname}
        if offender := await db.get_entries(self.db, "irc_hostmask_offenses" if nick else "irc_hostname_offenses", [[key, "==", filters[key]] for key in filters.keys()]):
            return self.bot.privmsg(target if target != self.bot.nick else mask.nick, "{} has offended {} times.".format(nick, offender[-1].count))
        elif len(args['<args>']) == 1:
            return self.bot.privmsg(target if target != self.bot.nick else mask.nick, "No offenses found for hostname {}".format(hostname))
        else:
            return self.bot.privmsg(target if target != self.bot.nick else mask.nick, "{} from {} hasn't offended.".format(nick, hostname))

    @command(show_in_help_list=False)
    async def flooder(self, mask=None, target=None, args=None):
        """Flood counter

            %%flooder <nick>
        """
        details = extract_user_details(mask)
        if await rate_limit_check(self, target if target != self.bot.nick else details['nick'], details): return
        count = 0
        if flood_limiter := await db.get_entries(self.db, "irc_nick_flood_limiter", [["nick", "==", args['<nick>']]]):
            count = flood_limiter[-1].count
        return self.bot.privmsg(target if target != self.bot.nick else mask.nick, "Flood limit count {}.".format(count))

    @command(show_in_help_list=False)
    async def rate_limiter(self, mask=None, target=None, args=None):
        """rate_limiter counter

            %%rate_limiter <nick>
        """
        details = extract_user_details(mask)
        if await rate_limit_check(self, target if target != self.bot.nick else details['nick'], details): return
        count = 0
        if rate_limiter := await db.get_entries(self.db, "irc_nick_rate_limiter", [["nick", "==", args['<nick>']]]):
            count = rate_limiter[-1].count
        return self.bot.privmsg(target if target != self.bot.nick else mask.nick, "Command rate limit count {}.".format(count))


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
    print("IRC Layer - Bot Commands")
    print("-" * 50)
    logging.info("Start!!")
    main()
