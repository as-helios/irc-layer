import sys
from datetime import timedelta
from typing import Annotated

import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, Depends, WebSocketException
from fastapi import Security, HTTPException
from fastapi.openapi.models import APIKey
from fastapi.params import Query
from fastapi.security import APIKeyHeader
from sqlalchemy.event import listen
from starlette import status
from starlette.requests import Request
from starlette.websockets import WebSocket

import db
from custom import *

load_dotenv()
app_log_file = "{}/logs/ingest.log".format(os.getenv('DATA_FOLDER'))
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
ignore_masks = get_json_from_file("{}/config/irc/ignore.json".format(os.getenv("DATA_FOLDER")), '[]')


async def validate_api_key(database: db.Session = Depends(db.get_db), x_api_key: str = Security(X_API_KEY)):
    valid = False
    try:
        api_keys = await db.get_entries(database, "api_keys", [["key", "==", x_api_key]])
    except Exception as e:
        pass
    else:
        for api_key in api_keys:
            if str(x_api_key) == api_key.key and not api_key.disabled:
                valid = True
    if valid:
        return x_api_key
    else:
        raise HTTPException(status_code=403, detail="Could not validate API Key")


def send_to_pubsub(_model, _database, entry, *arg):
    line = entry.__dict__
    if 'channel' not in line.keys() and 'target' not in line.keys():
        return
    del line["_sa_instance_state"]
    line = {k: v if v is not None else "" for k, v in line.items()}
    line_anonymized = {k: v for k, v in line.items() if k not in ['hostname', 'userhost', 'username', 'mask', 'mask_old', 'mask_new']}

    if 'modes' in line_anonymized.keys() and 'data' in line_anonymized.keys():
        line_anonymized['data'] = censor_masks(line_anonymized['data'])

    channel = str(line['channel'] if 'channel' in line.keys() else line['target']).lstrip('#')
    if 'op' in line.keys():
        publish_to_pubsub("public:{}".format(channel), line_anonymized)
        publish_to_pubsub("$secret:{}".format(channel), line)
    elif 'modes' in line.keys():
        publish_to_pubsub("public:{}".format(channel), line_anonymized)
        publish_to_pubsub("$secret:{}".format(channel), line)
    elif 'event_type' in line.keys():
        publish_to_pubsub("public:{}".format(channel), line_anonymized)
        publish_to_pubsub("$secret:{}".format(channel), line)
    elif 'nick_old' in line.keys():
        if not line['nick_old']: return
        publish_to_pubsub("public:{}".format(channel), line_anonymized)
        publish_to_pubsub("$secret:{}".format(channel), line)


listen(db.IRCLogMessages, "after_insert", send_to_pubsub)
listen(db.IRCLogModes, "after_insert", send_to_pubsub)
listen(db.IRCLogEvents, "after_insert", send_to_pubsub)
listen(db.IRCLogNickChanges, "after_insert", send_to_pubsub)


async def write_if_does_not_exist(database, table, request_body):
    intolerance = 30
    timestamp = datetime.fromisoformat(request_body['created_at'])
    # skip if stale
    if datetime.utcnow() > timestamp + timedelta(seconds=intolerance):
        return False

    # clean whitespaces
    if 'content' in request_body and request_body['content'] is not None:
        request_body['content'] = request_body['content'].strip()
    if 'data' in request_body and request_body['data'] is not None:
        request_body['data'] = request_body['data'].strip()

    # prepare filters
    if table == 'irc_log_messages':
        filters = [["content", "==", request_body['content']], ["nick", "==", request_body['nick']], ["channel", "==", request_body['channel']]]
    elif table == 'irc_log_modes':
        filters = [["operation", "==", request_body['operation']], ["modes", "==", request_body['modes']], ["nick", "==", request_body['nick']],
                   ["data", "==", request_body['data']] if 'data' in request_body.keys() else ["data", "is", None],
                   ["target", "==", request_body['target']] if 'target' in request_body.keys() else ["target", "is", None]]
    elif table == 'irc_log_events':
        filters = [["event_type", "==", request_body['event_type']], ["nick", "==", request_body['nick']], ["channel", "==", request_body['channel']]]
        if 'content' in request_body.keys() and request_body['content'] is not None:
            filters.append(["content", "==", request_body['content']])
        if 'data' in request_body.keys() and request_body['data'] is not None:
            filters.append(["data", "==", request_body['data']])
    elif table == 'irc_log_nick_changes':
        filters = [["nick_old", "==", request_body['nick_old']], ["nick_new", "==", request_body['nick_new']], ["channel", "==", request_body['channel']]]
    else:
        return False
    from_timestamp = timestamp - timedelta(seconds=intolerance)
    to_timestamp = timestamp + timedelta(seconds=intolerance)
    filters.extend([["created_at", ">=", from_timestamp], ["created_at", "<=", to_timestamp]])
    if existing := await db.get_entries(database, table, filters):
        if existing == [(None,)]:
            return False
        for e in existing:
            timestamp_ingested = e.created_at.timestamp()
            timestamp_ingesting = datetime.fromisoformat(request_body['created_at']).timestamp()
            a_to_b = timestamp_ingesting - timestamp_ingested
            b_to_a = timestamp_ingested - timestamp_ingesting
            if (a_to_b > 0 and a_to_b < intolerance) or (b_to_a > 0 and b_to_a < intolerance):
                return False
    # if check_local_ingest_records(table, request_body, request_body['channel'] if 'channel' in request_body else request_body['target']):
    await db.write_entry(database, table, request_body)
        # await save_record_for_reference(table, request_body)
    return request_body
    # return False


async def get_websocket_api_key(websocket: WebSocket, database: db.Session = Depends(db.get_db), api_key: Annotated[str | None, Query()] = None):
    x_api_key = api_key
    valid = False
    try:
        api_keys = await db.get_entries(database, "api_keys", [["key", "==", x_api_key]])
    except Exception as e:
        pass
    else:
        for api_key in api_keys:

            if str(x_api_key) == api_key.key and not api_key.disabled:
                valid = True
    if valid:
        return x_api_key
    else:
        raise WebSocketException(code=status.WS_1008_POLICY_VIOLATION)


async def websocket_validate_api_key(database, x_api_key):
    valid = False
    try:
        api_keys = await db.get_entries(database, "api_keys", [["key", "==", x_api_key]])
    except Exception as e:
        pass
    else:
        for api_key in api_keys:
            if str(x_api_key) == api_key.key and not api_key.disabled:
                valid = True
    return valid


@app.websocket("/irc/ws")
async def irc_websocket(websocket: WebSocket, database: db.Session = Depends(db.get_db)):  # , x_api_key: Annotated[str, Depends(get_websocket_api_key)]
    await websocket.accept()
    data = await websocket.receive_text()
    data = json.loads(data)
    if not await websocket_validate_api_key(database, data['api_key']):
        await websocket.close()
    while True:
        data = await websocket.receive_text()
        data = json.loads(data)
        # fix messages
        if data['table'] == 'irc_log_messages':
            data['channel'] = data['target']
            data['content'] = data['data']
            data['data'] = None
        # submit line to db
        if await write_if_does_not_exist(database, data['table'], data):
            response = "ACCEPTED: {}".format(data)
        else:
            response = "EXISTS: {}".format(data)
        # send result to client
        print(response)
        await websocket.send_text(response)
        # update channel topic
        if data['table'] == 'irc_log_events' and data['event_type'] == 'TOPIC':
            await db.edit_entries(database, "irc_channels", {"topic": data['content']}, [["channel", "==", data['channel']]])


@app.post("/irc/message")
async def irc_message(request: Request, database: db.Session = Depends(db.get_db), key: APIKey = Depends(validate_api_key)):
    request_body = await request.json()
    if 'target' in request_body and request_body['target'][0] != '#': return
    request_body['channel'] = request_body['target']
    request_body['content'] = request_body['data']
    request_body['data'] = None
    if await write_if_does_not_exist(database, "irc_log_messages", request_body):
        response = "ACCEPTED: {}".format(request_body)
        logging.info(response)
    else:
        response = "EXISTS: {}".format(request_body)
        logging.info(response)
    return response


@app.post("/irc/mode")
async def irc_mode(request: Request, database: db.Session = Depends(db.get_db), key: APIKey = Depends(validate_api_key)):
    request_body = await request.json()
    if await write_if_does_not_exist(database, "irc_log_modes", request_body):
        response = "ACCEPTED: {}".format(request_body)
        logging.info(response)
    else:
        response = "EXISTS: {}".format(request_body)
        logging.info(response)
    return response


@app.post("/irc/event")
async def irc_event(request: Request, database: db.Session = Depends(db.get_db), key: APIKey = Depends(validate_api_key)):
    request_body = await request.json()
    if await write_if_does_not_exist(database, "irc_log_events", request_body):
        response = "ACCEPTED: {}".format(request_body)
        if request_body['event_type'] == 'TOPIC':
            await db.edit_entries(database, "irc_channels", {"topic": request_body['content']}, [["channel", "==", request_body['channel']]])
        logging.info(response)
    else:
        response = "EXISTS: {}".format(request_body)
        logging.info(response)
    return response


@app.post("/irc/nick-changes")
async def irc_nick_changes(request: Request, database: db.Session = Depends(db.get_db), key: APIKey = Depends(validate_api_key)):
    request_body = await request.json()
    if await write_if_does_not_exist(database, "irc_log_nick_changes", request_body):
        response = "ACCEPTED: {}".format(request_body)
        logging.info(response)
    else:
        response = "EXISTS: {}".format(request_body)
        logging.info(response)
    return response


@app.get("/")
async def root():
    return "Hello world!"


if __name__ == "__main__":
    print("-" * 50)
    print("IRC Layer - Logger Ingest")
    print("-" * 50)
    logging.info("Start!!")
    uvicorn.run(app, host=os.getenv("WEB_SERVER_HOST"), port=int(os.getenv("WEB_SERVER_PORT")))
