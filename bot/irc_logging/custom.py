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


def sort_modes(data):
    symbol = ""
    action = {}
    sorted = []
    for d in data:
        if not d.isalnum():
            if action:
                sorted.append(action)
                action = {}
            if d not in action.keys():
                action[d] = []
            symbol = d
        else:
            action[symbol].append(d)
    sorted.append(action)
    return sorted


async def edit_channel_status_list(self, channel_id, channel_user_id, event, list_type):
    operation = '-' if event in ("PART", "QUIT", "KICK", "-") else '+'
    if operation == '-' and len(await db.get_entries(self.db, "irc_channel_ops" if list_type == 'op' else "irc_channel_voices", [["channel_id", "==", channel_id], ["channel_user_id", "==", channel_user_id]])) == 0:
        return
    channel_user = await get_nick_from_channel_user_id(self, channel_user_id)
    channel_name = await get_channel_name_from_id(self, channel_id)
    details = {"channel_id": channel_id, "channel_user_id": channel_user_id}

    match list_type:
        case 'op':
            if not channel_name in self.oplist.keys():
                self.oplist[channel_name] = []
            user_list = self.oplist[channel_name]
            table = "irc_channel_ops"
        case 'voice':
            if not channel_name in self.voicelist.keys():
                self.voicelist[channel_name] = []
            user_list = self.voicelist[channel_name]
            table = "irc_channel_voices"
        case other:
            return False

    match operation:
        case '+':
            if channel_user[-1].nick not in user_list:
                user_list.append(channel_user[-1].nick)
            await db.write_entry(self.db, table, details)
        case '-':
            if channel_user[-1].nick in user_list:
                user_list.remove(channel_user[-1].nick)
            await db.remove_entries(self.db, table, details)


async def edit_channel_userlist(self, channel_id, details, event):
    operation = '-' if event in ("PART", "QUIT", "KICK", "-") else '+'
    if not (db_channel_users := await db.get_entries(self.db, "irc_channel_users", [["channel_id", "==", channel_id], ["nick", "==", details['nick']]])):
        nick = details['nick'][1:] if details['nick'][0] in ('@', '+',) else details['nick']
        details['nick'] = nick
    match operation:
        case '+':
            if not db_channel_users:
                await db.write_entry(self.db, "irc_channel_users", details)
        case '-':
            await db.remove_entries(self.db, "irc_channel_users", {"channel_id": channel_id, "nick": details['nick']})


async def get_nick_from_channel_user_id(self, channel_user_id):
    return await db.get_entries(self.db, "irc_channel_users", [["id", "==", channel_user_id]])


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
