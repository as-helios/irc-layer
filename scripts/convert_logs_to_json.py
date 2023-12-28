import datetime
import glob
import os
import re
import sys
import json

import pytz


def write_to_file(data, path):
    folder = '/'.join(path.split('/')[:-1])
    if not os.path.exists(folder) and folder != '.' and folder != '':
        os.makedirs(folder)
    with open(path, 'w') as file:
        file.write(str(data))
    return data


def read_from_file(path, default_value=None):
    if os.path.isfile(path):
        return "\n".join([line.strip() for line in open(path, "r+")])
    elif not default_value:
        return False
    else:
        return default_value


def get_mask_from_nick(nick):
    if nick in nickmasks.keys():
        return nickmasks[nick]
    else:
        return False


def str_to_datetime_xchat(datetime_string):
    month, day, time = datetime_string.split(" ")[:3]
    months = {
        "Oct": 10,
        "Nov": 11,
        "Dec": 12
    }
    hour, minute, second = time.split(":")[:3]
    if hour != "00" and minute != "00" and second != "00":
        print(hour, minute, second)
        dt = datetime.datetime(year=2023, month=int(months[month]), day=int(day), hour=int(hour), minute=int(minute), second=int(second), tzinfo=pytz.utc)
        # dt.astimezone(pytz.utc)
    else:
        dt = datetime.datetime(year=2023, month=int(months[month]), day=int(day), hour=int(hour), minute=int(minute), second=int(second), tzinfo=pytz.utc)
    return dt


nickmasks = {}


def extract_user_details(mask):
    try:
        mask_parts = mask.split('!')
        nick = mask_parts[0]
        userhost = mask_parts[1]
        userhost_parts = userhost.split('@')
        username = userhost_parts[0]
        hostname = userhost_parts[1]
    except IndexError:
        return False
    details = {"mask": mask, "nick": nick, "userhost": userhost, "username": username, "hostname": hostname}
    return details


def detect_quit(line):
    matches = re.match("^[a-zA-Z]+ \d{2} \d{2}:\d{2}:\d{2} \*[\s]{1}[@a-zA-Z0-9_\-\[\]\\\`\.]+ has quit \([^\)]*\)", line)
    if matches:
        matches_parts = matches[0].split(' *	')
        if len(matches_parts) == 1:
            matches_parts = matches[0].split(' * ')
        matches_parts2 = matches_parts[1].split(' ')
        reason = ' '.join(matches_parts2[3:]).strip('(').strip(')')
        timestamp = str_to_datetime_xchat(matches_parts[0])
        #if not "00:00:00" in matches_parts[0]:
        #    timestamp = timestamp.astimezone(pytz.utc)
        results = {"created_at": timestamp.isoformat()}
        if "+" not in results['created_at'] and "00:00:00" in matches_parts[0]:
            results['created_at'] += "+00:00"
        results.update({
            "pruned_at": None,
            "nick": matches_parts2[0],
            "userhost": matches_parts2[1].lstrip("(").rstrip(")"),
            "event_type": "QUIT",
            "data": None,
            "content": reason if reason else None,
            "channel": global_channel
        })
        if results['nick'] in nickmasks.keys():
            details = extract_user_details(nickmasks[results['nick']])
            details = {"mask": details['mask'], "nick": details['nick'], "userhost": details['userhost'], "username": details['username'], "hostname": details['hostname']}
        else:
            details = {"mask": None, "nick": results['nick'], "userhost": None, "username": None, "hostname": None}
        if not results['channel']:
            results['channel'] = global_channel
        results.update(details)
        return results
    matches = re.match("\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d+Z\] [\*]{3} [@a-zA-Z0-9_\-\[\]\\\`\.]+ \([^)]+\) quit \([^)]*\)", line)
    if matches:
        matches_parts = matches[0].split(' *** ')
        matches_parts2 = matches_parts[1].split(' ')
        results = {
            "created_at": datetime.datetime.fromisoformat(matches_parts[0].lstrip('[').rstrip(']')).isoformat(),
            "pruned_at": None,
            "nick": matches_parts2[0],
            "userhost": matches_parts2[1].lstrip("(").rstrip(")"),
            "event_type": "QUIT",
            "data": None,
            "content": None,
            "channel": global_channel
        }
        if results['nick'] in nickmasks.keys():
            details = extract_user_details(nickmasks[results['nick']])
            details = {"mask": details['mask'], "nick": details['nick'], "userhost": details['userhost'], "username": details['username'], "hostname": details['hostname']}
        else:
            details = {"mask": None, "nick": results['nick'], "userhost": None, "username": None, "hostname": None}
        if not results['channel']:
            results['channel'] = global_channel
        results.update(details)
        return results


def detect_part(line):
    matches = re.match("^[a-zA-Z]+ \d{2} \d{2}:\d{2}:\d{2} \*[\s\t]+[@a-zA-Z0-9_\-\[\]\\\`\.]+ \([^)]+\) has left .*", line)
    if matches:
        matches_parts = matches[0].split(' *	')
        if len(matches_parts) == 1:
            matches_parts = matches[0].split(' * ')
        matches_parts2 = matches_parts[1].split(' ')
        timestamp = str_to_datetime_xchat(matches_parts[0])
        #if not "00:00:00" in matches_parts[0]:
        #    timestamp = timestamp.astimezone(pytz.utc)
        results = {"created_at": timestamp.isoformat()}
        if "+" not in results['created_at'] and "00:00:00" in matches_parts[0]:
            results['created_at'] += "+00:00"
        results.update({
            "pruned_at": None,
            "nick": matches_parts2[0],
            "userhost": matches_parts2[1].lstrip("(").rstrip(")"),
            "event_type": "PART",
            "data": None,
            "content": None,
            "channel": global_channel
        })
        if results['nick'] in nickmasks.keys():
            details = extract_user_details(nickmasks[results['nick']])
            details = {"mask": details['mask'], "nick": details['nick'], "userhost": details['userhost'], "username": details['username'], "hostname": details['hostname']}
        else:
            details = {"mask": None, "nick": results['nick'], "userhost": None, "username": None, "hostname": None}
        if not results['channel']:
            results['channel'] = global_channel
        results.update(details)
        return results
    matches = re.match("\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d+Z\] [\*]{3} [@a-zA-Z0-9_\-\[\]\\\`\.]+ \([^)]+\) left \([^)]+\)", line)
    if matches:
        matches_parts = matches[0].split(' *** ')
        matches_parts2 = matches_parts[1].split(' ')
        results = {
            "created_at": datetime.datetime.fromisoformat(matches_parts[0].lstrip('[').rstrip(']')).isoformat(),
            "pruned_at": None,
            "nick": matches_parts2[0],
            "userhost": matches_parts2[1].lstrip("(").rstrip(")"),
            "event_type": "PART",
            "data": None,
            "content": None,
            "channel": global_channel
        }
        if results['nick'] in nickmasks.keys():
            details = extract_user_details(nickmasks[results['nick']])
            details = {"mask": details['mask'], "nick": details['nick'], "userhost": details['userhost'], "username": details['username'], "hostname": details['hostname']}
        else:
            details = {"mask": None, "nick": results['nick'], "userhost": None, "username": None, "hostname": None}
        if not results['channel']:
            results['channel'] = global_channel
        results.update(details)
        return results


def detect_join(line):
    matches = re.match("^[a-zA-Z]+ \d{2} \d{2}:\d{2}:\d{2} \*[\s\t]{1}[@a-zA-Z0-9_\-\[\]\\\`\.]+ \([^)]+\) .*", line)
    if matches:
        matches_parts = matches[0].split(' *	')
        if len(matches_parts) == 1:
            matches_parts = matches[0].split(' * ')
        matches_parts2 = matches_parts[1].split(' ')
        try:
            timestamp = str_to_datetime_xchat(matches_parts[0])
        except:
            print(line)
            sys.exit()
        #if not "00:00:00" in matches_parts[0]:
        #    timestamp = timestamp.astimezone(pytz.utc)
        results = {"created_at": timestamp.isoformat()}
        if "+" not in results['created_at'] and "00:00:00" in matches_parts[0]:
            results['created_at'] += "+00:00"
        results.update({
            "pruned_at": None,
            "nick": matches_parts2[0],
            "userhost": matches_parts2[1].lstrip("(").rstrip(")"),
            "event_type": "JOIN",
            "data": None,
            "content": None,
            "channel": global_channel
            # "channel": matches_parts2[-1]
        })
        details = extract_user_details("{}!{}".format(results['nick'], results['userhost']))
        nickmasks[details['nick']] = details['mask']
        results.update(details)
        # update missing details
        for i, log in enumerate(processed_log):
            if (('nick' in log.keys() and log['nick'] == details['nick']) or ('nick_old' in log.keys() and (log['nick_old'] == details['nick'] or log['nick_new'] == details['nick']))):
                for k, v in details.items():
                    if k == 'nick': continue
                    if k in processed_log[i].keys():
                        processed_log[i][k] = v
        return results
    matches = re.match("\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d+Z\] [\*]{3} [@a-zA-Z0-9_\-\[\]\\\`\.]+ \([^)]+\) joined", line)
    if matches:
        matches_parts = matches[0].split(' *** ')
        matches_parts2 = matches_parts[1].split(' ')
        results = {
            "created_at": datetime.datetime.fromisoformat(matches_parts[0].lstrip('[').rstrip(']')).isoformat(),
            "pruned_at": None,
            "nick": matches_parts2[0],
            "userhost": matches_parts2[1].lstrip("(").rstrip(")"),
            "event_type": "JOIN",
            "data": None,
            "content": None,
            "channel": global_channel
        }
        details = extract_user_details("{}!{}".format(results['nick'], results['userhost']))
        nickmasks[details['nick']] = details['mask']
        results.update(details)
        # update missing details
        for i, log in enumerate(processed_log):
            if (('nick' in log.keys() and log['nick'] == details['nick']) or ('nick_old' in log.keys() and (log['nick_old'] == details['nick'] or log['nick_new'] == details['nick']))):
                for k, v in details.items():
                    if k == 'nick': continue
                    if k in processed_log[i].keys():
                        processed_log[i][k] = v
        return results


def detect_nick(line):
    matches = re.match("^[a-zA-Z]+ \d{2} \d{2}:\d{2}:\d{2} \*[\s\t]+[@a-zA-Z0-9_\-\[\]\\\`\.]+ is now known as [@a-zA-Z0-9_\-\[\]\\\`\.]+.*", line)
    if matches:
        matches_parts = matches[0].split(' *	')
        if len(matches_parts) == 1:
            matches_parts = matches[0].split(' * ')
        matches_parts2 = matches_parts[1].split(' ')
        timestamp = str_to_datetime_xchat(matches_parts[0])
        #if not "00:00:00" in matches_parts[0]:
        #    timestamp = timestamp.astimezone(pytz.utc)
        results = {"created_at": timestamp.isoformat()}
        if "+" not in results['created_at'] and "00:00:00" in matches_parts[0]:
            results['created_at'] += "+00:00"
        results.update({
            "pruned_at": None,
            "nick_old": (nick_old := matches_parts2[0]),
            "channel": global_channel,
            "nick_new": (nick_new := matches_parts2[-1])
        })
        if results['nick_old'] in nickmasks.keys():
            nickmasks[results['nick_new']] = nickmasks[results['nick_old']].replace(results['nick_old'], results['nick_new'])
            details = extract_user_details(nickmasks[results['nick_new']])
        else:
            details = {"mask": None, "userhost": None, "username": None, "hostname": None}
        results.update(details)
        results.update({
            "mask_old": (mask_old := "{}!{}".format(results['nick_old'], details['userhost'])),
            "mask_new": mask_old.replace(results['nick_old'] + "!", results['nick_new'] + "!")
        })
        return results
    matches = re.match("\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d+Z\] [\*]{3} [@a-zA-Z0-9_\-\[\]\\\`\.]+ changed nick to [@a-zA-Z0-9_\-\[\]\\\`\.]+", line)
    if matches:
        matches_parts = matches[0].split(' *** ')
        matches_parts2 = matches_parts[1].split(' ')
        results = {
            "created_at": datetime.datetime.fromisoformat(matches_parts[0].lstrip('[').rstrip(']')).isoformat(),
            "nick_old": (nick_old := matches_parts2[0]),
            "userhost": (userhost := matches_parts2[1].lstrip("(").rstrip(")")),
            "channel": global_channel,
            "nick_new": (nick_new := matches_parts2[-1])
        }
        if results['nick_old'] in nickmasks.keys():
            nickmasks[results['nick_new']] = nickmasks[results['nick_old']].replace(results['nick_old'], results['nick_new'])
            details = extract_user_details(nickmasks[results['nick_new']])
        else:
            details = {"mask": None, "userhost": None, "username": None, "hostname": None}
        results.update(details)
        results.update({
            "mask_old": (mask_old := "{}!{}".format(results['nick_old'], details['userhost'])),
            "mask_new": mask_old.replace(results['nick_old'] + "!", results['nick_new'] + "!")
        })
        return results

    matches = re.match("^[a-zA-Z]+ \d{2} \d{2}:\d{2}:\d{2} \* You are now known as [@a-zA-Z0-9_\-\[\]\\\`\.]+", line)
    if matches:
        matches_parts = matches[0].split(' * ')
        matches_parts2 = matches_parts[1].split(' ')
        timestamp = str_to_datetime_xchat(matches_parts[0])
        #if not "00:00:00" in matches_parts[0]:
        #    timestamp = timestamp.astimezone(pytz.utc)
        results = {"created_at": timestamp.isoformat()}
        if "+" not in results['created_at'] and "00:00:00" in matches_parts[0]:
            results['created_at'] += "+00:00"
        nick_old = "Helios"
        results.update({
            "nick_old": nick_old,
            "userhost": (userhost := matches_parts2[1].lstrip("(").rstrip(")"))
            "channel": global_channel,
            "nick_new": (nick_new := matches_parts2[-1])
        })
        if results['nick_old'] in nickmasks.keys():
            nickmasks[results['nick_new']] = nickmasks[results['nick_old']].replace(results['nick_old'], results['nick_new'])
            details = extract_user_details(nickmasks[results['nick_new']])
        else:
            details = {"mask": None, "userhost": None, "username": None, "hostname": None}
        results.update(details)
        results.update({
            "mask_old": (mask_old := "{}!{}".format(results['nick_old'], details['userhost'])),
            "mask_new": mask_old.replace(results['nick_old'] + "!", results['nick_new'] + "!")
        })
        return results


def detect_topic(line):
    if " *\t" in line:
        line = line.replace(" *\t", " * ")
    matches = re.match("^[a-zA-Z]+ \d{2} \d{2}:\d{2}:\d{2} \*[\s\t]+[@a-zA-Z0-9_\-\[\]\\\`\.]+ (\([^)]+\) |)has changed the topic to: .*", line)
    if matches:
        matches_parts = matches[0].split(' * ')
        matches_parts2 = matches_parts[1].split(' ')
        results = {
            "created_at": str_to_datetime_xchat(matches_parts[0]).isoformat(),
            "pruned_at": None,
            "nick": matches_parts2[0],
            "userhost": None,
            "event_type": "TOPIC",
            "channel": global_channel,
            "content": line.split("has changed the topic to: ")[1].strip("'"),
            "data": None
        }
        if mask := get_mask_from_nick(results['nick']):
            details = extract_user_details(mask)
        else:
            details = {"mask": None, "nick": results['nick'], "userhost": None, "username": None, "hostname": None}
        results.update(details)
        return results
    matches = re.match("\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d+Z\] [\*]{3} [@a-zA-Z0-9_\-\[\]\\\`\.]+ changed topic to .*", line)
    if matches:
        matches_parts = matches[0].split(' *** ')
        matches_parts2 = matches_parts[1].split(' ')
        results = {
            "created_at": datetime.datetime.fromisoformat(matches_parts[0].lstrip('[').rstrip(']')).isoformat(),
            "pruned_at": None,
            "nick": matches_parts2[0],
            "userhost": None,
            "event_type": "TOPIC",
            "channel": global_channel,
            "content": line.split("changed topic to ")[1].strip("'"),
            # "content": ' '.join(matches_parts2[4:]).strip("'"),
            "data": None
        }
        if mask := get_mask_from_nick(results['nick']):
            details = extract_user_details(mask)
        else:
            details = {"mask": None, "nick": results['nick'], "userhost": None, "username": None, "hostname": None}
        results.update(details)
        return results


def detect_message(line):
    matches = re.match("^[a-zA-Z]+ \d{2} \d{2}:\d{2}:\d{2} \<[@a-zA-Z0-9_\-\[\]\\\`\.]+\>.*", line)
    if matches:
        matches_parts = matches[0].split(' <', 1)
        if '> ' in matches_parts[1]:
            matches_parts2 = matches_parts[1].split('> ')
        elif '>	' in matches_parts[1]:
            matches_parts2 = matches_parts[1].split('>	')
        elif '>' in matches_parts[1]:
            matches_parts2 = matches_parts[1].split('>')
        timestamp = str_to_datetime_xchat(matches_parts[0])
        timestamp = timestamp.astimezone(pytz.utc)
        results = {"created_at": timestamp.isoformat()}
        if "+" not in results['created_at'] and "00:00:00" in matches_parts[0]:
            results['created_at'] += "+00:00"
        results.update({
            "nick": matches_parts2[0].lstrip("@"),
            "content": '> '.join(matches_parts2[1:]).lstrip('> ').strip(),
            "channel": global_channel,
            "pruned_at": None,
            "op": False,
            "voice": False
        })
        if mask := get_mask_from_nick(results['nick']):
            details = extract_user_details(mask)
        else:
            details = {"mask": None, "nick": results['nick'], "userhost": None, "username": None, "hostname": None}
        results.update(details)
        if " <@{}>".format(results['nick']) in line:
            results['op'] = True
        elif " <+{}>".format(results['nick']) in line:
            results['voice'] = True
        return results
    matches = re.match("\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d+Z\] <[@a-zA-Z0-9_\-\[\]\\\`\.]+>.*", line)
    if matches:
        matches_parts = matches[0].split(' <', 1)
        if '> ' in matches_parts[1]:
            matches_parts2 = matches_parts[1].split('> ')
        elif '>	' in matches_parts[1]:
            matches_parts2 = matches_parts[1].split('>	')
        elif '>' in matches_parts[1]:
            matches_parts2 = matches_parts[1].split('>')
        results = {
            "created_at": datetime.datetime.fromisoformat(matches_parts[0].lstrip('[').rstrip(']')).isoformat(),
            "nick": matches_parts2[0].lstrip("@"),
            "content": '> '.join(matches_parts2[1:]).lstrip('> ').strip(),
            "channel": global_channel,
            "pruned_at": None,
            "op": False
        }
        if mask := get_mask_from_nick(results['nick']):
            details = extract_user_details(mask)
        else:
            details = {"mask": None, "nick": results['nick'], "userhost": None, "username": None, "hostname": None}
        results.update(details)
        if " <@{}>".format(results['nick']) in line:
            results['op'] = True
        if " <+{}>".format(results['nick']) in line:
            results['voice'] = True
        return results


def detect_emote(line):
    matches = re.match("[a-zA-Z]+ \d{2} \d{2}:\d{2}:\d{2} \*[\s\t]+[@a-zA-Z0-9_\-\[\]\\\`\.]+.*", line)
    if matches:
        matches_parts = matches[0].split(' *	')
        if len(matches_parts) == 1:
            matches_parts = matches[0].split(' * ')
        matches_parts2 = matches_parts[1].split(' ')
        timestamp = str_to_datetime_xchat(matches_parts[0])
        #if not "00:00:00" in matches_parts[0]:
        #    timestamp = timestamp.astimezone(pytz.utc)
        results = {"created_at": timestamp.isoformat()}
        if "+" not in results['created_at'] and "00:00:00" in matches_parts[0]:
            results['created_at'] += "+00:00"
        results.update({
            "nick": matches_parts2[0],
            "content": "\u0001ACTION {}\u0001".format(' '.join(matches_parts2[1:])),
            "channel": global_channel,
            "op": False # hackjob
        })
        if mask := get_mask_from_nick(results['nick']):
            details = extract_user_details(mask)
        else:
            details = {"mask": None, "nick": results['nick'], "userhost": None, "username": None, "hostname": None}
        results.update(details)
        return results
    matches = re.match("\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d+Z\] [\*]{1} [@a-zA-Z0-9_\-\[\]\\\`\.]+ .*", line)
    if matches:
        matches_parts = matches[0].split(' * ')
        if len(matches_parts) == 1:
            matches_parts = matches[0].split(' * ')
        matches_parts2 = matches_parts[1].split(' ')
        results = {
            "created_at": datetime.datetime.fromisoformat(matches_parts[0].lstrip('[').rstrip(']')).isoformat(),
            "nick": matches_parts2[0],
            "content": "\u0001ACTION {}\u0001".format(' '.join(matches_parts2[1:])),
            "channel": global_channel,
            "op": False # hackjob
        }
        if mask := get_mask_from_nick(results['nick']):
            details = extract_user_details(mask)
        else:
            details = {"mask": None, "nick": results['nick'], "userhost": None, "username": None, "hostname": None}
        results.update(details)
        return results


def detect_kick(line):
    matches = re.match("\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d+Z\] [\*]{3} [@a-zA-Z0-9_\-\[\]\\\`\.]+ was kicked by [@a-zA-Z0-9_\-\[\]\\\`\.]+ \([^)]+\)", line)
    if matches:
        matches_parts = matches[0].split(' *** ')
        matches_parts2 = matches_parts[1].split(' ')
        results = {
            "created_at": datetime.datetime.fromisoformat(matches_parts[0].lstrip('[').rstrip(']')).isoformat(),
            "nick": matches_parts2[-2],
            "event_type": "KICK",
            "content": matches_parts2[0],
            "data": matches_parts2[-1].lstrip('(').rstrip(')'),
            "channel": global_channel,
            "pruned_at": None
        }
        if mask := get_mask_from_nick(results['nick']):
            details = extract_user_details(mask)
        else:
            details = {"mask": None, "nick": results['nick'], "userhost": None, "username": None, "hostname": None}
        results.update(details)
        return results


def detect_mode(line):
    matches = re.match("^[a-zA-Z]+ \d{2} \d{2}:\d{2}:\d{2} \*[\s\t]+[@a-zA-Z0-9_\-\[\]\\\`\.]+ \([^)]+\) removes channel operator status from [a-zA-Z0-9_\-\[\]]+ \([^)]+\)", line)
    if matches:
        matches_parts = matches[0].split(' *	')
        if len(matches_parts) == 1:
            matches_parts = matches[0].split(' * ')
        matches_parts2 = matches_parts[1].split(' ')
        timestamp = str_to_datetime_xchat(matches_parts[0])
        #if not "00:00:00" in matches_parts[0]:
        #    timestamp = timestamp.astimezone(pytz.utc)
        results = {"created_at": timestamp.isoformat()}
        if "+" not in results['created_at'] and "00:00:00" in matches_parts[0]:
            results['created_at'] += "+00:00"
        results.update({
            "nick": matches_parts2[0],
            "userhost": matches_parts2[1].lstrip("(").rstrip(")"),
            "operation": "+",
            "modes": ["o"],
            "target": global_channel,
            "data": matches_parts2[-2],
            "pruned_at": None
        })
        if results['nick'] in nickmasks.keys():
            details = extract_user_details(nickmasks[results['nick']])
            details = {"mask": details['mask'], "nick": details['nick'], "userhost": details['userhost'], "username": details['username'], "hostname": details['hostname']}
        else:
            details = {"mask": None, "nick": results['nick'], "userhost": None, "username": None, "hostname": None}
        results.update(details)
        return results
    matches = re.match("^[a-zA-Z]+ \d{2} \d{2}:\d{2}:\d{2} \*[\s\t]+[@a-zA-Z0-9_\-\[\]\\\`\.]+ \([^)]+\) gives channel operator status to [@a-zA-Z0-9_\-\[\]\\\`\.]+ \([^)]+\)", line)
    if matches:
        matches_parts = matches[0].split(' *	')
        if len(matches_parts) == 1:
            matches_parts = matches[0].split(' * ')
        matches_parts2 = matches_parts[1].split(' ')
        timestamp = str_to_datetime_xchat(matches_parts[0])
        #if not "00:00:00" in matches_parts[0]:
        #    timestamp = timestamp.astimezone(pytz.utc)
        results = {"created_at": timestamp.isoformat()}
        if "+" not in results['created_at'] and "00:00:00" in matches_parts[0]:
            results['created_at'] += "+00:00"
        results.update({
            "nick": matches_parts2[0],
            "userhost": matches_parts2[1].lstrip("(").rstrip(")"),
            "operation": "+",
            "modes": ["o"],
            "target": global_channel,
            "data": matches_parts2[-2],
            "pruned_at": None
        })
        if results['nick'] in nickmasks.keys():
            details = extract_user_details(nickmasks[results['nick']])
            details = {"mask": details['mask'], "nick": details['nick'], "userhost": details['userhost'], "username": details['username'], "hostname": details['hostname']}
        else:
            details = {"mask": None, "nick": results['nick'], "userhost": None, "username": None, "hostname": None}
        results.update(details)
        return results
    matches = re.match("^[a-zA-Z]+ \d{2} \d{2}:\d{2}:\d{2} \*[\s\t]+[@a-zA-Z0-9_\-\[\]\\\`\.]+ sets ban on [^!]+![^@]+@[a-zA-Z0-9_\-:\.]+", line)
    if matches:
        matches_parts = matches[0].split(' *	')
        if len(matches_parts) == 1:
            matches_parts = matches[0].split(' * ')
        matches_parts2 = matches_parts[1].split(' ')
        timestamp = str_to_datetime_xchat(matches_parts[0])
        #if not "00:00:00" in matches_parts[0]:
        #    timestamp = timestamp.astimezone(pytz.utc)
        results = {"created_at": timestamp.isoformat()}
        if "+" not in results['created_at'] and "00:00:00" in matches_parts[0]:
            results['created_at'] += "+00:00"
        results.update({
            "nick": matches_parts2[0],
            "userhost": matches_parts2[1].lstrip("(").rstrip(")"),
            "operation": "+",
            "modes": ["b"],
            "target": global_channel,
            "data": matches_parts2[-1],
            "pruned_at": None
        })
        if results['nick'] in nickmasks.keys():
            details = extract_user_details(nickmasks[results['nick']])
            details = {"mask": details['mask'], "nick": details['nick'], "userhost": details['userhost'], "username": details['username'], "hostname": details['hostname']}
        else:
            details = {"mask": None, "nick": results['nick'], "userhost": None, "username": None, "hostname": None}
        results.update(details)
        return results
    matches = re.match("\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d+Z\] [\*]{3} [@a-zA-Z0-9_\-\[\]\\\`\.]+ set mode \+[a-zA-Z]+ [^!]+![^@]+@[a-zA-Z0-9_\-:\.]+.*", line)
    if matches:
        matches_parts = matches[0].split(' *** ')
        matches_parts2 = matches_parts[1].split(' ')
        operation = matches_parts2[3][0]
        modes = list(matches_parts2[3][1:])
        results = {
            "created_at": datetime.datetime.fromisoformat(matches_parts[0].lstrip('[').rstrip(']')).isoformat(),
            "nick": matches_parts2[0],
            "userhost": matches_parts2[1].lstrip("(").rstrip(")"),
            "operation": operation,
            "modes": modes,
            "target": global_channel,
            "data": matches_parts2[-1],
            "pruned_at": None
        }
        if results['nick'] in nickmasks.keys():
            details = extract_user_details(nickmasks[results['nick']])
            details = {"mask": details['mask'], "nick": details['nick'], "userhost": details['userhost'], "username": details['username'], "hostname": details['hostname']}
        else:
            details = {"mask": None, "nick": results['nick'], "userhost": None, "username": None, "hostname": None}
        results.update(details)
        return results
    matches = re.match("\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d+Z\] [\*]{3} [@a-zA-Z0-9_\-\[\]\\\`\.]+ set mode (-|\+)[a-zA-Z]+ .*", line)
    if matches:
        matches_parts = matches[0].split(' *** ')
        matches_parts2 = matches_parts[1].split(' ')
        operation = matches_parts2[3][0]
        modes = list(matches_parts2[3][1:])
        results = {
            "created_at": datetime.datetime.fromisoformat(matches_parts[0].lstrip('[').rstrip(']')).isoformat(),
            "nick": matches_parts2[0],
            "userhost": matches_parts2[1].lstrip("(").rstrip(")"),
            "operation": operation,
            "modes": modes,
            "target": global_channel,
            "data": ' '.join(matches_parts2[4:]),
            "pruned_at": None
        }
        if results['nick'] in nickmasks.keys():
            details = extract_user_details(nickmasks[results['nick']])
            details = {"mask": details['mask'], "nick": details['nick'], "userhost": details['userhost'], "username": details['username'], "hostname": details['hostname']}
        else:
            details = {"mask": None, "nick": results['nick'], "userhost": None, "username": None, "hostname": None}
        results.update(details)
        return results
    matches = re.match("\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d+Z\] [\*]{3} [@a-zA-Z0-9_\-\[\]\\\`\.]+ set mode (-|\+)[a-zA-Z]+.*", line)
    if matches:
        matches_parts = matches[0].split(' *** ')
        matches_parts2 = matches_parts[1].split(' ')
        data = ' '.join(matches_parts2[4:])
        modes = sort_modes(matches_parts2[3].lstrip(':'))

        who = []
        if data:
            who = data.strip().split(' ')

        total_results = []

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
                results = {
                    "created_at": datetime.datetime.fromisoformat(matches_parts[0].lstrip('[').rstrip(']')).isoformat(),
                    "nick": matches_parts2[0],
                    "userhost": matches_parts2[1].lstrip("(").rstrip(")"),
                    "operation": operation,
                    "modes": modes_per_operation,
                    "target": global_channel,
                    "data": who[i] if len(who) > 0 else None,
                    "pruned_at": None
                }
                if results['nick'] in nickmasks.keys():
                    details = extract_user_details(nickmasks[results['nick']])
                    details = {"mask": details['mask'], "nick": details['nick'], "userhost": details['userhost'], "username": details['username'], "hostname": details['hostname']}
                else:
                    details = {"mask": None, "nick": results['nick'], "userhost": None, "username": None, "hostname": None}
                results.update(details)
                total_results.append(results)
        return total_results


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

logs = []
log_files = glob.glob(os.path.join(os.getcwd(), "*.log"))
for filename in log_files:
    logs.append(filename.split('/')[-1])

for l in logs:
    global_channel = l.split('.')[0]
    lines = read_from_file("./{}".format(l)).split("\n")
    processed_log = []
    for line in lines:
        if not line:
            continue
        skip = False
        for s in ("-NickServ-",):
            if s in line:
                skip = True
                break
        if skip:
            continue
        if (line.startswith("*") or
                "* Topic for " in line or
                "* Attempting to join" in line or
                "IRC log started " in line):
            continue
        elif line_json := detect_topic(line):
            pass
        elif line_json := detect_mode(line):
            pass
        elif line_json := detect_quit(line):
            pass
        elif line_json := detect_part(line):
            pass
        elif line_json := detect_join(line):
            pass
        elif line_json := detect_kick(line):
            pass
        elif line_json := detect_nick(line):
            pass
        elif line_json := detect_emote(line):
            pass
        elif line_json := detect_message(line):
            pass
        elif not line_json:
            print("Couldn't regex: {}".format(line))
            sys.exit()
            continue
        if type(line_json) is not list:
            line_json = [line_json]
        for lj in line_json:
            processed_log.append(lj)


    results = json.dumps(processed_log, indent=4)
    write_to_file(results, "./{}.json".format(l))
