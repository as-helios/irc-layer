import logging
import os
import re

from cent import Client, core

import chain
import db


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


def sort_by_timestamp(item):
    # ts = datetime.strptime(item["created_at"] if "created_at" in item else item["created_at"], "%Y-%m-%dT%H:%M:%S.%f")
    return (item["created_at"], item["id"])


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


def anonymize_ip(address):
    return re.sub(r'[^.: @!]', '•', address)


def anonymize_string(text):
    return '•' * len(text)


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


def token_abi():
    return [{"inputs": [], "name": "name", "outputs": [{"internalType": "string", "name": "", "type": "string"}], "stateMutability": "view", "type": "function"},
            {"inputs": [], "name": "symbol", "outputs": [{"internalType": "string", "name": "", "type": "string"}], "stateMutability": "view", "type": "function"},
            {"inputs": [], "name": "totalSupply", "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}], "stateMutability": "view", "type": "function"},
            {"inputs": [], "name": "decimals", "outputs": [{"internalType": "uint8", "name": "", "type": "uint8"}], "stateMutability": "view", "type": "function"},
            {"constant": True, "inputs": [{"internalType": "address", "name": "", "type": "address"}], "name": "balanceOf", "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
             "payable": False, "stateMutability": "view", "type": "function"},{"constant": False, "inputs": [{"name": "amount", "type": "uint256"}], "name": "burn", "outputs": [], "payable": False, "stateMutability": "nonpayable", "type": "function"},
            {"anonymous": False, "inputs": [{"indexed": True, "internalType": "address", "name": "from", "type": "address"}, {"indexed": True, "internalType": "address", "name": "to", "type": "address"},
                                            {"indexed": False, "internalType": "uint256", "name": "value", "type": "uint256"}], "name": "Transfer", "type": "event"}]


async def response_wrapper(database, session, response):
    return await set_session_id_cookie(database, session['session_id'], response)


async def set_session_id_cookie(database, session_id, response):
    session_length = await db.get_entries(database, "settings", [["key", "==", "session_length"]], 1)
    response.set_cookie(
        key="session_id",
        value=session_id,
        max_age=int(session_length) if session_length.isnumeric() else (24 * 60 * 60),
        httponly=False,
        secure=False
    )
    return response


async def get_channel_name_from_id(database, id):
    if channel := await db.get_entries(database, "irc_channels", [["id", "==", id]]):
        return channel[-1].channel
    else:
        return False


async def get_channel_id_from_name(database, channel):
    if channel := await db.get_entries(database, "irc_channels", [["channel", "==", channel]]):
        return channel[-1].id
    else:
        return False


async def refresh_spam_filters(database):
    spam_filters = {}
    cache = {}
    for l in ('hostnames', 'nicks', 'hostmasks', 'phrases'):
        spam_filters[l] = {}
        spam_filters[l]['*'] = []
        for f in await db.get_entries(database, "irc_banned_{}".format(l), [["disabled", "is", False]]):
            if f == (None,) or not hasattr(f, "channel_id"): continue
            if f.channel_id is not None:
                channel_name = await get_channel_name_from_id(database, f.channel_id)
                if str(f.channel_id) not in cache.keys():
                    cache[str(f.channel_id)] = channel_name
                if cache[str(f.channel_id)] not in spam_filters[l].keys():
                    spam_filters[l][cache[str(f.channel_id)]] = []
                spam_filters[l][cache[str(f.channel_id)]].append(f.__dict__)
            else:
                spam_filters[l]['*'].append(f.__dict__)
    return spam_filters


async def get_powers(database, wallet_address):
    powers = []
    if not wallet_address: return powers
    if tags := await db.get_entries(database, "tags"):
        for t in tags:
            contract = chain.web3.eth.contract(str(t.token_contract.address), abi=token_abi())
            balance = int(contract.functions.balanceOf(wallet_address).call()) / 10 ** int(t.token_contract.decimals)
            if balance > t.token_amount_required:
                powers.append(t.name)
    return powers


# async def get_session(request: Request, database: Session = Depends(db.get_db)):
#     # check if session is still valid
#     if session_id := request.cookies.get("session_id"):
#         logging.info(session_id)
#         # check if session_id is in database
#         sessions = jsonable_encoder(db.get_entries(database, "sessions", [["session_id", "==", session_id]]))
#         logging.info(sessions)
#
#         for session in sessions:
#             # session must exist, not be expired, not be disabled
#             if session['session_id'] == session_id and datetime.strptime(session['created_at'], "%Y-%m-%dT%H:%M:%S.%f") < datetime.utcnow() and session['disabled'] is None:
#                 # found a valid session
#                 return session
#
#     # new session
#     session = {
#         "session_id": generate_random_string(33),
#         "signed_message": None,
#         "expired_at": datetime.utcnow() + timedelta(seconds=24 * 60 * 60),
#         "disabled": None
#     }
#     return jsonable_encoder(await db.write_entry(database, "sessions", session))

def publish_to_pubsub(channels, message):
    if type(channels) is not list:
        channels = [channels]
    try:
        client = Client(os.getenv("CENTRIFUGO_API_URL"), api_key=os.getenv("CENTRIFUGO_API_KEY"), timeout=30)
        for c in channels:
            client.publish(c, message)
    except core.RequestException as e:
        logging.error(e)
