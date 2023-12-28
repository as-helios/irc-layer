import sys
from datetime import timedelta

import jwt
import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, Depends
from fastapi import Security, HTTPException
from fastapi.encoders import jsonable_encoder
from fastapi.openapi.models import APIKey
from fastapi.security import APIKeyHeader
from fastapi_limiter.depends import RateLimiter
from sqlalchemy.orm import Session
from starlette.middleware.cors import CORSMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, HTMLResponse

from common import *
from custom import *

load_dotenv()
app_log_file = "{}/logs/api.log".format(os.getenv('DATA_FOLDER'))
logging.basicConfig(
    format='%(asctime)s %(name)s %(levelname)s %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S',
    level=logging.INFO,
    handlers=[
        logging.FileHandler(app_log_file),
        logging.StreamHandler(sys.stdout)
    ]
)
X_API_KEY = APIKeyHeader(name="X-Api-Key", auto_error=False)
app = FastAPI(docs_url=None, redoc_url=None)
app.add_middleware(
    CORSMiddleware,
    allow_origins=['https://app.bigpp.icu'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)


async def validate_api_key(database: db.Session = Depends(db.get_db), x_api_key: str = Security(X_API_KEY)):
    try:
        api_keys = await db.get_entries(database, "api_keys", [["key", "==", x_api_key]])
    except Exception as e:
        logging.error(e)
        pass
    else:
        for api_key in api_keys:
            if str(x_api_key) == api_key.key and not api_key.disabled:
                return api_key
    raise HTTPException(status_code=403, detail="Could not validate API Key")


@app.on_event("startup")
async def startup_event():
    # prepare database
    db.Base.metadata.create_all(bind=db.engine)


@app.post("/logs/{channel}")
async def get_channel_logs(request: Request, database: db.Session = Depends(db.get_db), dependencies=[Depends(RateLimiter(times=1, seconds=1))]):
    try:
        request_body = await request.json()
    except Exception as e:
        logging.error(e)
        request_body = {}
    secret = False
    if 'session_id' in request_body.keys() and 'wallet_address' in request_body.keys():
        signed_message_content = "Every entry of knowledge compounds into the wealth of wisdom, a currency that transcends the ages. \n\n{}".format(request_body['session_id'])
        if await chain.check_signed_message(signed_message_content, request_body['signed_message'], request_body['wallet_address']):
            if session := await db.get_entries(database, "sessions", [["session_id", "==", request_body['session_id']]]):
                secret = True if 'SECRET' in session[0].tags else False

    options = []
    for p in request.query_params.keys():
        if p in ('events', 'modes', 'nicks', 'raw', 'antispam',):
            if request.query_params[p] == '1':
                options.append(p)
    if 'messages' in request.query_params.keys() and request.query_params['messages'] == '1':
        options.insert(0, 'messages')
    tables = {"messages": "irc_log_messages", "modes": "irc_log_modes", "events": "irc_log_events", "nicks": "irc_log_nick_changes"}

    if 'from_timestamp' in request.query_params.keys() and request.query_params['from_timestamp'].isnumeric():
        from_timestamp = datetime.fromtimestamp(float(request.query_params['from_timestamp']))
    else:
        from_timestamp = None

    if 'to_timestamp' in request.query_params.keys() and request.query_params['to_timestamp'].isnumeric():
        to_timestamp = datetime.fromtimestamp(float(request.query_params['to_timestamp']))
    else:
        to_timestamp = None

    if from_timestamp is not None and to_timestamp is not None and to_timestamp > from_timestamp:
        return []  # bad query

    channel = "#{}".format(request.path_params['channel'].lstrip('#'))
    all_lines = []
    for i, o in enumerate(options):
        if o == 'modes':
            filters = [['target', '==', channel]]
        else:
            filters = [['channel', '==', channel]]
        if not 'raw' in options:
            filters.append(['pruned_at', 'is', None])
        if from_timestamp is None and len(all_lines) > 0:
            all_lines = sorted(all_lines, key=sort_by_timestamp)
            from_timestamp = all_lines[0]['created_at']
        if from_timestamp is not None:
            filters.append(['created_at', '>', from_timestamp])
        if to_timestamp is not None:
            filters.append(['created_at', '<', to_timestamp])
        if o not in tables.keys():
            continue
        if o != 'nicks' and 'nick' in request.query_params.keys():
            filters.append(['nick', '==', request.query_params['nick']])
        if o == 'nicks' and 'nick_old' in request.query_params.keys():
            filters.append(['nick_old', '==', request.query_params['nick_old']])
        if o == 'nicks' and 'nick_new' in request.query_params.keys():
            filters.append(['nick_new', '==', request.query_params['nick_new']])
        if 'username' in request.query_params.keys():
            filters.append(['username', '==', request.query_params['username']])
        if 'userhost' in request.query_params.keys():
            filters.append(['userhost', '==', request.query_params['userhost']])
        if 'hostname' in request.query_params.keys():
            filters.append(['hostname', '==', request.query_params['hostname']])
        all_lines.extend(db.to_list_of_dict(await db.get_entries(database, tables[o], filters, 33 if i == 0 else 0, 'created_at', 'desc')))

    pruning = []
    if 'antispam' in options:
        for line in all_lines:
            if line['pruned_at']:
                pruning.append(line['id'])
                continue
            if 'op' not in line.keys():
                continue
            if 'content' in line.keys():
                prune_phrases = await db.get_entries(database, "irc_banned_phrases")
                if prune_phrases != [(None,)]:
                    for pp in prune_phrases:
                        if match_banned_phrase(pp.phrase, line['content'], pp.search_type):
                            pruning.append(line['id'])
                            break
            if not pruning:
                tables = [
                    # ["irc_log_nick_prune", [["nick", "==", line['nick']], ["hostname", "==", line['hostname']]]],
                    ["irc_banned_hostmasks", [["nick", "==", line['nick']], ["hostname", "==", line['hostname']]]],
                    ["irc_banned_hostnames", [["hostname", "==", line['hostname']]]],
                    ["irc_banned_nicks", [["nick", "==", line['nick']]]]
                ]
                prune_search = []
                for table in tables:
                    prune_search.extend(await db.get_entries(database, table[0], table[1]))
                    if prune_search and prune_search != [(None,)]:
                        pruning.append(line['id'])
                        break

            spam_filters = await refresh_spam_filters(database)
            lists = ['hostmasks', 'hostnames', 'nicks']
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
                    if c not in spam_filters[l].keys():
                        continue
                    for f in spam_filters[l][c]:
                        a, b = f, line
                        if match_banned_identity(a, b, search_columns, f['search_type']):
                            pruning.append(line['id'])
                            break

    # scrub data from lines
    if not secret:
        sorting_lines = []
        for al in all_lines:
            if not al: continue
            if not 'channel' in al.keys() and 'modes' not in al.keys(): continue
            line_anonymized = {k: v for k, v in al.items() if k not in ['_sa_instance_state', 'hostname', 'userhost', 'username', 'mask', 'mask_old', 'mask_new']}
            line_anonymized['created_at'] = line_anonymized['created_at'].isoformat()  # strftime("%Y-%m-%d %H:%M:%S")
            # anonymize ipv4 and ipv6
            if 'modes' in line_anonymized.keys() and 'data' in line_anonymized.keys():
                line_anonymized['data'] = censor_masks(line_anonymized['data'])

            # collect the line
            sorting_lines.append(line_anonymized)
    else:
        sorting_lines = all_lines

    # order lines by timestamp
    lines = sorted(sorting_lines, key=sort_by_timestamp)
    # remove pruned message ids
    lines = [l for l in lines if l['id'] not in pruning]
    # reduce to last 30 lines
    lines = lines[-30:]

    if 'json' in request.query_params and request.query_params['json'] == '1':
        response = {}
        if [k for k in ('messages', 'events', 'modes', 'nicks',) if k in request.query_params.keys() and request.query_params[k] == '1']:
            response.update({"history": lines, "filtered": not secret and 'antispam' in options})
        if 'topic' in request.query_params and request.query_params['topic'] == '1':
            channel = await db.get_entries(database, "irc_channels", [["channel", "==", channel]], 1)
            response.update({"topic": channel.topic})
        return JSONResponse(jsonable_encoder(response))

    output = []
    for line in lines:
        if 'op' in line.keys():
            output.append("[{}] &lt;{}{}&gt; {}".format(line['created_at'], "@" if line['op'] else "", line['nick'], line['content']))
        elif 'modes' in line.keys() and 'modes' in options:
            output.append("[{}] *** {} set mode {}{} {}".format(line['created_at'], line['nick'], line['operation'], ''.join(line['modes']), line['data'] if line['data'] else ""))
        elif 'event_type' in line.keys() and line['event_type'] != "TOPIC" and 'events' in options:
            output.append(
                "[{}] *** {} {}{}{}".format(line['created_at'], line['nick'], line['event_type'].lower(), "ed" if line['event_type'] != "QUIT" else "s", " ({})".format(line['content']) if line['content'] else ""))
        elif 'event_type' in line.keys() and line['event_type'] == "TOPIC" and 'events' in options:
            output.append("[{}] *** {} changed topic to '{}'".format(line['created_at'], line['nick'], line['content']))
        elif 'nick_old' in line.keys() and 'nicks' in options:
            if not line['nick_old']: continue
            output.append("[{}] *** {} changed nick to {}".format(line['created_at'], line['nick_old'], line['nick_new']))
    return HTMLResponse(content="<p style=\"font-family: Courier;\">" + "<br>".join(output) + "</p>", status_code=200)


@app.get("/ingest/token/{contract_address}")
async def ingest_token_contract(request: Request, database: Session = Depends(db.get_db), key: APIKey = Depends(validate_api_key)):
    contract_address = request.path_params['contract_address'].strip()
    contract = chain.web3.eth.contract(contract_address, abi=token_abi())
    data = {
        "address": contract_address,
        "name": contract.functions.name().call(),
        "symbol": contract.functions.symbol().call(),
        "decimals": contract.functions.decimals().call(),
        "supply": contract.functions.totalSupply().call()
    }
    return await db.edit_or_write(database, "token_contracts", data, [["address", "==", contract_address]])


@app.post("/topic")
async def set_channel_topic(request: Request, database: db.Session = Depends(db.get_db), key: APIKey = Depends(validate_api_key)):
    try:
        request_body = await request.json()
    except Exception as e:
        logging.error(e)
        return False
    if 'channel' in request_body.keys() and 'topic' in request_body.keys():
        return JSONResponse(jsonable_encoder(await db.edit_entries(database, "irc_channels", {"topic": request_body['topic']}, [["channel", "==", request_body['channel']]])))
    else:
        return False


@app.get("/stats")
async def stats(database: db.Session = Depends(db.get_db), key: APIKey = Depends(validate_api_key)):
    channels = await db.get_entries(database, "irc_channels")
    data = {"channels": {}}
    unique_nicks = []
    for c in channels:
        data['channels'][c.channel] = len(c.userlist)
        for u in c.userlist:
            if u.nick not in unique_nicks:
                unique_nicks.append(u.nick)
    data['online'] = len(unique_nicks)
    return JSONResponse(jsonable_encoder(data))


@app.get("/setup")
async def setup(request: Request, database: db.Session = Depends(db.get_db), key: APIKey = Depends(validate_api_key)):
    # create master api key
    keys = jsonable_encoder(await db.get_entries(database, "api_keys"))
    if not keys:
        api_key_data = {"label": "MASTER", "key": generate_random_string(33), "power": 105}
        await db.write_entry(database, "api_keys", api_key_data)
        keys = jsonable_encoder(await db.get_entries(database, "api_keys"))
    else:
        return "Setup already done."
    settings_default = get_json_from_file("{}/config/default_settings.json".format(os.getenv("DATA_FOLDER")))
    for default in settings_default:
        entry = jsonable_encoder(default)
        entry['disabled'] = None
        await db.edit_or_write(database, "settings", entry, [["key", "==", default['key']]])

    assign_bots = {}
    bots = get_json_from_file("{}/config/irc/channels.json".format(os.getenv("DATA_FOLDER")))
    for bot in bots.keys():
        for channel in set(bots[bot]):
            if channel not in assign_bots.keys():
                assign_bots[channel] = [bot]
            else:
                assign_bots[channel].append(bot)
    for channel in assign_bots.keys():
        await db.edit_or_write(database, "irc_channels", {"channel": channel, "bots": assign_bots[channel]}, [["channel", "==", channel]])

    return keys


@app.post("/verify")
async def session_verify(request: Request, database: db.Session = Depends(db.get_db)):
    try:
        request_body = await request.json()
    except Exception as e:
        logging.error(e)
        return
    if "session_id" not in request_body.keys() or not request_body['session_id']: return "??????????"
    if "signed_message" not in request_body.keys() or not request_body['signed_message'] or request_body['signed_message'] == 'false': return "??????????"
    token_gate_contract_address = await db.get_entries(database, "settings", [["key", "==", "token_gate_contract_address"]])
    if not token_gate_contract_address:
        logging.error(error := "No token gate contract address is set!")
        return JSONResponse({"error": 1, "message": error})
    else:
        token_gate_contract_address = token_gate_contract_address[0].value
    # check if the signed_message, session_id, wallet_address are legit
    signed_message_content = "Every entry of knowledge compounds into the wealth of wisdom, a currency that transcends the ages. \n\n{}".format(request_body['session_id'])
    if not (signed_address := await chain.check_signed_message(signed_message_content, request_body['signed_message'], request_body['wallet_address'])):
        logging.error(error := "Wallet address does not matched signed message!")
        return JSONResponse({"error": 1, "message": error})

    tags = await get_powers(database, signed_address)
    # record session
    session = jsonable_encoder(await db.get_entries(database, "sessions", [["session_id", "==", request_body['session_id']]]))
    session_length = await db.get_entries(database, "settings", [["key", "==", "session_length"]], 1)
    session_length = session_length.value
    if len(session) == 0:
        session = {
            "session_id": request_body['session_id'],
            "signed_message": request_body['signed_message'],
            "tags": tags,
            "disabled": False,
            "expired_at": datetime.utcnow() + timedelta(seconds=int(session_length) if session_length.isnumeric() else (24 * 60 * 60)),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        await db.write_entry(database, "sessions", session)
    else:
        session = {
            "signed_message": request_body['signed_message'],
            "tags": tags,
            "updated_at": datetime.utcnow(),
            "expired_at": datetime.utcnow() + timedelta(seconds=int(session_length) if session_length.isnumeric() else (24 * 60 * 60)),
        }
        await db.edit_entries(database, "sessions", session, [["session_id", "==", request_body['session_id']]])

    # reference session after writing
    session = jsonable_encoder(await db.get_entries(database, "sessions", [["session_id", "==", request_body['session_id']]]))
    if len(session) > 0 and session[0]['signed_message']:
        if session[0]['signed_message'] == request_body['signed_message']:
            session_id = session[0]['session_id']
            expired_at = datetime.fromisoformat(session[0]['expired_at'])
            if expired_at < datetime.utcnow() or session[0]['disabled']:
                logging.error(error := "Session has expired!")
                return JSONResponse({"error": 1, "message": error})
        else:
            logging.error(error := "Session ID does not match signed message!")
            return JSONResponse({"error": 1, "message": error})
    else:
        logging.error(error := "Session ID failed to save!")
        return JSONResponse({"error": 1, "message": error})

    wallet_token_info = await chain.get_token_balance(token_gate_contract_address, signed_address)
    return JSONResponse({"wallet": signed_address, "balance": wallet_token_info['balance'] / 10 ** wallet_token_info['decimals'], "signed_message": request_body['signed_message'], "session_id": session_id,
                         "expired_at": expired_at.isoformat()})


@app.post("/jwt")
async def jwt_token(request: Request, database: db.Session = Depends(db.get_db)):
    request_body = await request.json()

    session_length = await db.get_entries(database, "settings", [["key", "==", "session_length"]], 1)
    session_length = session_length.value
    session_id = request_body['session_id'] if 'session_id' in request_body.keys() else generate_random_string(33)
    signed_message = request_body['signed_message'] if 'signed_message' in request_body.keys() else False
    wallet_address = request_body['wallet_address'] if 'wallet_address' in request_body.keys() else False
    # verify signed_message owner
    signed_message_content = "Every entry of knowledge compounds into the wealth of wisdom, a currency that transcends the ages. \n\n{}".format(session_id)
    wallet_address = await chain.check_signed_message(signed_message_content, signed_message, wallet_address)
    if session := await db.get_entries(database, "sessions", [["session_id", "==", session_id], ["disabled", "is", None]]):
        # invalidate session if signed_message doesn't match
        if session[0].signed_message != signed_message:
            entry = {
                "disabled": True,
                "updated_at": datetime.utcnow()
            }
            await db.edit_entries(database, "sessions", entry, [["session_id", "==", session_id]])
            session = {"tags": []}
        else:
            session = session[0].__dict__
    else:
        # collect token balance/powers
        tags = await get_powers(database, wallet_address)
        # create a blank session here
        session = {
            "session_id": session_id,
            "signed_message": signed_message,
            "tags": tags,
            "disabled": False,
            "expired_at": datetime.utcnow() + timedelta(seconds=int(session_length) if session_length.isnumeric() else (24 * 60 * 60)),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        await db.write_entry(database, "sessions", session)

    # collect channel strings
    channels = await db.get_entries(database, "irc_channels")
    channels = [c.channel for c in channels]
    namespace = "$secret" if 'SECRET' in session['tags'] else "public"

    # check for supplied timestamp
    timestamp = int(request.query_params['ts']) if request.query_params['ts'].isnumeric() else datetime.utcnow().timestamp()
    expired_at = timestamp + (int(session_length) if session_length.isnumeric() else (24 * 60 * 60))
    # form the subclaim
    claims = {
        "sub": session_id,
        "exp": expired_at,
        "timestamp": timestamp,
        "channels": ["{}:{}".format(namespace, c) for c in channels]
        # "subs": dict([("{}:{}".format(namespace, c), {"data": {}},) for c in channels])
    }
    # sign encode the subclaim into a jwt
    token = jwt.encode(claims, os.getenv("CENTRIFUGO_SECRET"), algorithm="HS256")
    return {"session_id": session_id, "signed_message": signed_message, "wallet_address": wallet_address, "token": token, "channels": channels, "namespace": namespace, "expired_at": expired_at}


@app.get("/dispatch")
async def dispatch(request: Request, database: Session = Depends(db.get_db), key: APIKey = Depends(validate_api_key)):
    try:
        request_body = await request.json()
    except Exception as e:
        logging.error(e)
        return False
    irc_channels = await db.get_entries(database, "irc_channels", columns=["channel"], amount=0)
    pubsub_channels = []
    request_body['created_at'] = datetime.utcnow().isoformat()
    for namespace in ('public', '$secret',):
        pubsub_channels.extend(["{}:{}".format(namespace, c[0].lstrip('#')) for c in irc_channels])
    try:
        publish_to_pubsub(pubsub_channels, request_body)
    except Exception as e:
        logging.error(e)
        return False
    return True


@app.get("/tags")
async def tags(database: Session = Depends(db.get_db), key: APIKey = Depends(validate_api_key)):
    return JSONResponse(jsonable_encoder(await db.get_entries(database, "tags")))


@app.post("/tags/add")
async def tags_add(request: Request, database: Session = Depends(db.get_db), key: APIKey = Depends(validate_api_key)):
    request_body = await request.json()
    if 'id' in request_body.keys():
        if not (result := await db.edit_or_dont(database, "tags", request_body, [["id", "==", request_body['id']]])):
            result = {"error": 1}
    else:
        result = await db.write_entry(database, "tags", request_body)
    return JSONResponse(jsonable_encoder(result))


@app.post("/tags/edit/{id}")
async def tags_add(request: Request, database: Session = Depends(db.get_db), key: APIKey = Depends(validate_api_key)):
    request_body = await request.json()
    if not (result := await db.edit_or_dont(database, "tags", request_body, [["id", "==", request.path_params['id']]])):
        result = {"error": 1}
    return result


@app.post("/tags/remove/{id}")
async def tags_add(request: Request, database: Session = Depends(db.get_db), key: APIKey = Depends(validate_api_key)):
    return JSONResponse(jsonable_encoder(await db.remove_entries(database, "tags", [["id", "==", request.path_params['id']]])))


@app.get("/settings")
async def settings_list(request: Request, database: db.Session = Depends(db.get_db), key: APIKey = Depends(validate_api_key)):
    try:
        request_body = await request.json()
    except Exception as e:
        request_body = []
    return JSONResponse(jsonable_encoder(await db.get_entries(database, "settings", request_body)))


@app.post("/settings/write")
async def settings_write(request: Request, database: db.Session = Depends(db.get_db), key: APIKey = Depends(validate_api_key)):
    request_body = await request.json()
    if 'key' not in request_body.keys() and 'value' not in request_body.keys():
        return False
    filters = [["key", "==", request_body['key']]]
    await db.edit_or_write(database, "settings", {"key": request_body['key'], "value": request_body['value']}, filters)
    return JSONResponse(jsonable_encoder(await db.get_entries(database, "settings", filters)))


@app.post("/settings/remove/{id}")
async def settings_write(request: Request, database: db.Session = Depends(db.get_db), key: APIKey = Depends(validate_api_key)):
    return await db.remove_entries(database, "settings", [["id", "==", request.path_params['id']]])


@app.get("/users/{channel}")
async def users_in_channel(request: Request, database: db.Session = Depends(db.get_db), key: APIKey = Depends(validate_api_key)):
    channel_id = await get_channel_id_from_name(database, "#{}".format(request.path_params['channel']))
    rows = await db.get_entries(database, "irc_channel_users", [["channel_id", "==", channel_id]])
    users = []
    for r in rows:
        users.append(r.nick)
    return JSONResponse(users)


@app.get("/users")
async def users_in_all_channels(database: db.Session = Depends(db.get_db), key: APIKey = Depends(validate_api_key)):
    users = await db.get_entries(database, "irc_channel_users")
    channels = {}
    for u in users:
        if u.channel.channel not in channels.keys():
            channels[u.channel.channel] = []
        channels[u.channel.channel].append(u.nick)
    return JSONResponse(channels)


@app.get("/write/{table}")
async def write_to_table(request: Request, database: db.Session = Depends(db.get_db), key: APIKey = Depends(validate_api_key)):
    try:
        request_body = await request.json()
    except Exception as e:
        logging.error(e)
        return
    return JSONResponse(jsonable_encoder(await db.write_entry(database, request.path_params['table'], request_body)))


@app.get("/read/{table}")
async def read_table(request: Request, database: db.Session = Depends(db.get_db), key: APIKey = Depends(validate_api_key)):
    table = db.to_list_of_dict(await db.get_entries(database, request.path_params['table']))
    try:
        table = sorted(table, key=sort_by_timestamp)
    except Exception as e:
        pass
    try:
        return JSONResponse(jsonable_encoder(table))
    except Exception as e:
        pass
    try:
        return JSONResponse(db.to_list_of_dict(table))
    except Exception as e:
        pass


@app.get("/wipe/{table}")
async def wipe_table(request: Request, database: db.Session = Depends(db.get_db), key: APIKey = Depends(validate_api_key)):
    await db.remove_entries(database, request.path_params['table'], amount=0)
    return JSONResponse(jsonable_encoder(await db.get_entries(database, request.path_params['table'])))


@app.get("/delete/{table}/{id}")
async def delete_table_entry_id(request: Request, database: db.Session = Depends(db.get_db), key: APIKey = Depends(validate_api_key)):
    await db.remove_entries(database, request.path_params['table'], [["id", "==", request.path_params['id']]])
    return JSONResponse(jsonable_encoder(await db.get_entries(database, request.path_params['table'], [["id", "==", request.path_params['id']]])))


@app.get("/read/{table}/{id}")
async def read_table_entry_id(request: Request, database: db.Session = Depends(db.get_db), key: APIKey = Depends(validate_api_key)):
    return JSONResponse(jsonable_encoder(await db.get_entries(database, request.path_params['table'], [["id", "==", request.path_params['id']]])))



@app.get("/")
async def root():
    return "Hello world!"


if __name__ == "__main__":
    print("-" * 50)
    print("IRC Layer - API")
    print("-" * 50)
    logging.info("Start!!")
    uvicorn.run(app, host=os.getenv("WEB_SERVER_HOST"), port=int(os.getenv("WEB_SERVER_PORT")))
