import re
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


async def refresh_spam_filters(self):
    cache = {}
    for l in ('hostnames', 'nicks', 'hostmasks', 'phrases'):
        self.spam_filters[l] = {}
        self.spam_filters[l]['*'] = []
        for f in await db.get_entries(self.db, "irc_banned_{}".format(l), [["disabled", "is", False]]):
            if f == (None,) or not hasattr(f, "channel_id"): continue
            if f.channel_id is not None:
                channel_name = await get_channel_name_from_id(self, f.channel_id)
                if str(f.channel_id) not in cache.keys():
                    cache[str(f.channel_id)] = channel_name
                if cache[str(f.channel_id)] not in self.spam_filters[l].keys():
                    self.spam_filters[l][cache[str(f.channel_id)]] = []
                self.spam_filters[l][cache[str(f.channel_id)]].append(f.__dict__)
            else:
                self.spam_filters[l]['*'].append(f.__dict__)


async def count_offense(self, nick, hostname, value):
    # offenses can only be wiped, not reduced
    # wiping can only occur if the user is maxed out on offenses
    entry = {"hostname": hostname}
    if nick:
        entry['nick'] = nick
    if not (offender := await db.get_entries(self.db, "irc_hostmask_offenses" if nick else "irc_hostname_offenses", [["nick", "==", entry['nick'], ["hostname", "==", entry['hostname']]]])):
        entry.update({
            "count": 1
        })
        await db.write_entry(self.db, "irc_hostmask_offenses" if nick else "irc_hostname_offenses", entry)
    else:
        count = offender[-1].count + value
        await db.edit_entries(self.db, "irc_hostmask_offenses" if nick else "irc_hostname_offenses", {"count": count}, [["id", "==", offender[-1].id]])
        if not nick and count >= int(self.settings['hostname_offense_limit_max']):
            return True
        elif count >= int(self.settings['hostmask_offense_limit_max']):
            return True
    return False


async def flood_limit_check(self, nick, data):
    if not (flood_limits := await db.get_entries(self.db, "irc_nick_flood_limiter", [["nick", "==", nick]])):
        entry = {
            "nick": nick,
            "count": 1
        }
        await db.write_entry(self.db, "irc_nick_flood_limiter", entry)
    elif flood_limits[-1].count >= int(self.settings['flood_limit_max']):
        return True
    # 1 character can bypass, must be over 3 characters to trigger flood limiter
    elif len(data) != 1 and len(data) > int(self.flood_limit_character_threshold):
        flood_limits[-1].count += 1
        await db.edit_entries(self.db, "irc_nick_flood_limiter", flood_limits[-1], [["id", "==", flood_limits[-1].id]])
    return False


async def rate_limit_check(self, source, nick):
    # paired with any command that accesses the database
    if not (rate_limits := await db.get_entries(self.db, "irc_nick_rate_limiter", [["nick", "==", nick]])):
        entry = {
            "nick": nick,
            "count": 1
        }
        await db.write_entry(self.db, "irc_nick_rate_limiter", entry)
    elif rate_limits[-1].count >= int(self.settings['rate_limit_max']):
        return self.bot.privmsg(source, "You are sending commands too fast. Try again later.")
    else:
        rate_limits[-1].count += 1
        await db.edit_entries(self.db, "irc_nick_rate_limiter", rate_limits[-1], [["id", "==", rate_limits[-1].id]])
    return False


async def is_nick_registered_op_in_channel(self, details, channel):
    if not (nick_registered := await db.get_entries(self.db, "irc_nick_registered", [["nick", "==", details['nick']], ["mask", "==", details['mask']]])):
        return False
    if (channel_id := await get_channel_id_from_name(self, channel)) and (
    op := await db.get_entries(self.db, "irc_nick_registered_ops", [["nick_registered_id", "==", nick_registered[-1].id], ["channel_id", "==", channel_id]])):
        return op
    return False


async def is_nick_registered_op(self, details):
    if not (nick_registered := await db.get_entries(self.db, "irc_nick_registered", [["nick", "==", details['nick']], ["mask", "==", details['mask']]])):
        return False
    if not (op := await db.get_entries(self.db, "irc_nick_registered_ops", [["nick_registered_id", "==", nick_registered[-1].id]])):
        return False
    return len(op) > 0


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


async def get_db_settings(self, key):
    if settings := await db.get_entries(self.db, "settings", [["key", "==", key]]):
        return list(settings)[-1].__dict__['value']
    else:
        return None
