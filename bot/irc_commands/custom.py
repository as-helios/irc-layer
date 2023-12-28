import asyncio
import re
import time

import db


def extract_user_details(mask):
    mask_parts = mask.split('!')
    nick = mask_parts[0]
    userhost = mask_parts[1]
    userhost_parts = userhost.split('@')
    username = userhost_parts[0]
    hostname = userhost_parts[1]
    details = {"mask": mask, "nick": nick, "userhost": userhost, "username": username, "hostname": hostname}
    return details


def match_banned_phrase(search, line, search_type):
    match search_type:
        case 'string':
            if search in line:
                return True
        case 'regex':
            if re.match(search, line):
                return True
    return False


def match_banned_identity(a, b, search, search_type):
    conditions = []
    match search_type:
        case 'string':
            if type(search) is list:
                [conditions.append(s) for s in search if a[s] == b[s]]
                if sorted(conditions) == sorted(search):
                    return True
            elif search in a:
                return True
        case 'regex':
            if type(search) is list:
                [conditions.append(s) for s in search if re.match(a[s], b[s])]
                if sorted(conditions) == sorted(search):
                    return True
            elif a[search] in b[search]:
                return True
    return False


def get_line_type(data):
    types = {
        "event": "irc_log_events",
        "mode": "irc_log_modes",
        "message": "irc_log_messages",
        "nick": "irc_log_nicks",
    }
    data = data.lower()
    if data in types.keys():
        return types[data]
    elif data in types.values():
        return next((k for k in types.keys() if types[k] == data), None)


def get_table_and_line_id_from_string(text):
    line = text.split(':')
    if not (table := get_line_type(line[0])):
        return False, "type"
    if line[1].isalnum():
        line_id = int(line[1])
    else:
        return False, "ID"
    return table, line_id


async def count_admonish(self, target_nick_id, value):
    # admonishment can be forgiven and added/reduced at any time
    if not (op_admonishments := await db.get_entries(self.db, "irc_nick_registered_op_admonishments", [["nick_registered_id", "==", target_nick_id]])):
        entry = {
            "nick_registered_id": target_nick_id,
            "count": 1
        }
        await db.write_entry(self.db, "irc_nick_registered_op_admonishments", entry)
    else:
        op_admonishments[-1].count += value
        await db.edit_entries(self.db, "irc_nick_registered_op_admonishments", op_admonishments[-1], [["id", "==", op_admonishments[-1].id]])


async def count_offense(self, nick, hostname, value):
    # offenses can only be wiped, not reduced
    # wiping can only occur if the user is maxed out on offenses
    filters = {"hostname": hostname}
    if nick:
        filters['nick'] = nick
    if not (offender := await db.get_entries(self.db, "irc_hostmask_offenses" if nick else "irc_hostname_offenses", [[key, "==", filters[key]] for key in filters.keys()])):
        entry = {
            "nick": nick,
            "hostname": hostname,
            "count": 1
        }
        await db.write_entry(self.db, "irc_hostmask_offenses" if nick else "irc_hostname_offenses", entry)
        return False
    if not nick and offender[-1].count >= int(self.settings['hostname_offense_limit_max']):
        return True
    elif offender[-1].count >= int(self.settings['hostmask_offense_limit_max']):
        return True
    else:
        offender[-1].count += value
        await db.edit_entries(self.db, "irc_hostmask_offenses" if nick else "irc_hostname_offenses", offender[-1], [["id", "==", offender[-1].id]])
    return False


async def rate_limit_check(self, source, details):
    # paired with any command that accesses the database
    # ignore registered ops with valid hostmasks

    # check if cron jobs are running that help spam limiters decay
    if float(await get_db_settings(self, "cron_alive_timestamp")) + int(await get_db_settings(self, "cron_alive_timeout_seconds")) > time.time():
        if await is_nick_registered_op(self, details): return False
        if not (rate_limits := await db.get_entries(self.db, "irc_nick_rate_limiter", [["nick", "==", details['nick']]])):
            entry = {
                "nick": details['nick'],
                "count": 1
            }
            await db.write_entry(self.db, "irc_nick_rate_limiter", entry)
        elif rate_limits[-1].count >= int(self.settings['rate_limit_max']):
            return self.bot.privmsg(source, "You are sending commands too fast. Try again later.")
        else:
            rate_limits[-1].count += 1
            await db.edit_entries(self.db, "irc_nick_rate_limiter", rate_limits[-1], [["id", "==", rate_limits[-1].id]])
    return False


async def is_nick_channel_op(self, channel_id, details):
    channel_users = db.to_list_of_dict(await db.get_entries(self.db, "irc_channel_users", [["channel_id", "==", channel_id], ["nick", "==", details['nick']]]))
    channel_ops = await db.get_entries(self.db, "irc_channel_ops", [["channel_id", "==", channel_id], ["channel_user_id", "==", channel_users[-1]['id']]])
    return len(channel_ops) > 0


async def is_op_an_actor(self, nick_registered_id):
    if op := await db.get_entries(self.db, "irc_nick_registered_op_admonishments", [["nick_registered_id", "==", nick_registered_id]]):
        if op[-1].count > int(self.settings['admonish_limit_max']):
            return True
        else:
            return False
    else:
        return False


async def is_nick_registered(self, nick):
    if await db.get_entries(self.db, "irc_nick_registered", [["nick", "==", nick]]):
        return True
    return False


async def is_nick_registered_op(self, details):
    nick_registered = await db.get_entries(self.db, "irc_nick_registered", [["nick", "==", details['nick']], ["mask", "==", details['mask']]])
    op = await db.get_entries(self.db, "irc_nick_registered_ops", [["nick_registered_id", "==", nick_registered[-1].id]])
    return len(op) > 0


async def is_nick_registered_op_in_channel(self, details, channel):
    if not (nick_registered := await db.get_entries(self.db, "irc_nick_registered", [["nick", "==", details['nick']], ["mask", "==", details['mask']]])):
        return False
    if (channel_id := await get_channel_id_from_name(self, channel)) and (
            op := await db.get_entries(self.db, "irc_nick_registered_ops", [["nick_registered_id", "==", nick_registered[-1].id], ["channel_id", "==", channel_id]])):
        return op
    return False


async def is_nick_identified(self, details):
    if registered_nick := await db.get_entries(self.db, "irc_nick_registered", [["nick", "==", details['nick']], ["mask", "==", details['mask']]]):
        return registered_nick[-1]
    return False


async def custom_command_call(self, target, prefix, command):
    if commands := await db.get_entries(self.db, "irc_custom_commands", [["prefix", "==", prefix], ["command", "==", command]]):
        for c in commands:
            if c.channel == target or c.channel == '*':
                for line in list(commands[-1].response.split("\\n")):
                    self.bot.privmsg(target, line.strip())
                    await asyncio.sleep(1)
                return True
    else:
        return False


async def get_channel_id_from_name(self, channel):
    if channel := await db.get_entries(self.db, "irc_channels", [["channel", "==", channel]]):
        return channel[-1].id
    else:
        return False


async def get_channel_name_from_id(self, channel_id):
    if channel := await db.get_entries(self.db, "irc_channels", [["id", "==", channel_id]]):
        return channel[-1].channel
    else:
        return False


async def get_registered_id_from_nick(self, nick):
    if registered_nick := await get_registered_from_nick(self, nick):
        return registered_nick.id
    else:
        return False


async def get_registered_from_nick(self, nick):
    if registered_nick := await db.get_entries(self.db, "irc_nick_registered", [["nick", "==", nick]]):
        return registered_nick[-1]
    else:
        return False


async def check_if_nick_is_unknown(self, nick):
    if channel_user := await db.get_entries(self.db, "irc_channel_users", [["nick", "==", nick], ["mask", "==", "{}!?".format(nick)]]):
        whois = await self.whois(nick=nick)
        if whois['timeout']:
            return True
        channel_user = channel_user[-1].__dict__
        del channel_user['_sa_instance_state']
        del channel_user['id']
        del channel_user['channel_id']
        channel_user['hostname'] = whois['host']
        channel_user['userhost'] = "{}@{}".format(whois['username'], whois['host'])
        channel_user['username'] = whois['username']
        channel_user['mask'] = "{}!{}".format(whois['nick'], channel_user['userhost'])
        await db.edit_entries(self.db, "irc_channel_users", channel_user, {"nick": nick})
        return False


async def op_sanity_check(self, details):
    # checks if they are a registered nick with a valid mask
    if not (nick_registered := await db.get_entries(self.db, "irc_nick_registered", [["nick", "==", details['nick']], ["mask", "==", details['mask']]])):
        return False
    # first op is always sane
    if nick_registered[-1].id == 1:
        return True
    # checks if they are an op anywhere to run the rest of the check
    if not await db.get_entries(self.db, "irc_nick_registered_ops", [["nick_registered_id", "==", nick_registered[-1].id]]):
        return False
    # checks if the op has been admonished too many times
    if await is_op_an_actor(self, nick_registered[-1].id):
        return False
    return True


async def get_db_settings(self, key):
    return list(await db.get_entries(self.db, "settings", [["key", "==", key]]))[-1].__dict__['value']
