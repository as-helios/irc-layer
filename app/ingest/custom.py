import json
import logging
import os
import re
from datetime import datetime
from cent import Client, core

from common import write_to_file, get_json_from_file, md5_string


def anonymize_ip(address):
    return re.sub(r'[^.: @!]', '•', address)


def censor_masks(text):
    masks = text.split(' ')
    masks_anonymized = []
    for m in masks:
        if '!' in m:
            current_mask = m.split('!')
            masks_anonymized.append("{}!{}".format(current_mask[0], anonymize_ip(current_mask[1])))
        else:
            masks_anonymized.append(m)
    return ' '.join(masks_anonymized)


async def save_record_for_reference(table, request_body):
    if 'channel' in request_body.keys():
        channel = request_body['channel'][1:]
    elif 'target' in request_body.keys():
        channel = request_body['target'][1:]
    else:
        return
    os.makedirs(directory := "{}/ingest/accepted/{}".format(os.getenv('DATA_FOLDER'), channel), exist_ok=True)
    write_to_file(json.dumps(request_body, indent=4), "{}/{}-{}-{}.json".format(directory, table, md5_string(json.dumps(request_body)), int(datetime.fromisoformat(request_body['created_at']).timestamp())))


def check_local_ingest_records(table, data, channel=None):
    if 'channel' in data:
        channel = data['channel'][1:]
    elif 'target' in data:
        channel = data['target'][1:]
    directory = "{}/ingest/accepted/{}".format(os.getenv('DATA_FOLDER'), channel)
    if not os.path.exists(directory): return True
    related_files = []
    for filename in os.listdir(directory):
        if filename.startswith("{}-".format(table)) and filename.endswith('.json'):
            related_files.append(filename)
    for filename in related_files:
        entry = get_json_from_file("{}/{}".format(directory, filename))
        if not entry: continue
        intolerance = 3
        try:
            timestamp_ingested = float(filename.split('-')[2].replace('.json', ''))
        except Exception as e:
            logging.error(filename)
            logging.error(e)
            continue
        timestamp_ingesting = data['created_at']
        if type(timestamp_ingesting) is str:
            timestamp_ingesting = datetime.fromisoformat(timestamp_ingesting)
        timestamp_ingesting = timestamp_ingesting.timestamp()
        if timestamp_ingesting > timestamp_ingested + intolerance:
            continue
        # timestamp_ingested = datetime.fromtimestamp(int(filename.split('-')[1].replace('.json', ''))).timestamp()
        a_to_b = timestamp_ingested - timestamp_ingesting
        b_to_a = timestamp_ingesting - timestamp_ingested
        # only compare within time range, otherwise accept it
        if (a_to_b > 0 and a_to_b < intolerance) or (b_to_a > 0 and b_to_a < intolerance):
            if table == 'irc_log_messages' and entry['content'] == data['content'] and entry['nick'] == data['nick'] and entry['channel'] == data['channel']:
                return False
            elif table == 'irc_log_modes' and entry['operation'] == data['operation'] and entry['modes'] == data['modes'] and entry['nick'] == data['nick'] and entry['data'] == data['data'] and entry['target'] == data[
                'target']:
                return False
            elif table == 'irc_log_events' and entry['event_type'] == data['event_type'] and entry['nick'] == data['nick'] and entry['channel'] == data['channel']:
                if 'content' in entry.keys() and entry['content'] == data['content']:
                    return False
                if 'data' in entry.keys() and entry['data'] == data['data']:
                    return False
            elif table == 'irc_log_nick_changes' and entry['nick_old'] == data['nick_old'] and entry['nick_new'] == data['nick_new'] and entry['channel'] == data['channel']:
                return False
    return True


def publish_to_pubsub(channels, message):
    if type(channels) is not list:
        channels = [channels]
    try:
        client = Client(os.getenv("CENTRIFUGO_API_URL"), api_key=os.getenv("CENTRIFUGO_API_KEY"), timeout=30)
        for c in channels:
            client.publish(c, message)
    except core.RequestException as e:
        logging.error(e)
