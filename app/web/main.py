import asyncio
import logging
import sys

import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker

from common import *
from custom import *

load_dotenv()
app_log_file = "{}/logs/web.log".format(os.getenv('DATA_FOLDER'))
logging.basicConfig(
    format='%(asctime)s %(name)s %(levelname)s %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S',
    level=logging.INFO,
    handlers=[
        logging.FileHandler(app_log_file),
        logging.StreamHandler(sys.stdout)
    ]
)

app = FastAPI(dependencies=[Depends(db.get_db)])
Base = declarative_base()
engine = create_engine("postgresql://{0}:{1}@{2}:5432/{3}".format(os.getenv("POSTGRES_USER"), os.getenv("POSTGRES_PASSWORD"), "db", os.getenv("POSTGRES_DB")))
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
app.mount("/static", StaticFiles(directory="{}/static".format(os.getenv("DATA_FOLDER"))), name="static")
templates = Jinja2Templates(directory="{}/static/theme".format(os.getenv("DATA_FOLDER")))


@app.exception_handler(MaintenanceException)
async def maintenance_exception_handler(request: Request, exc: MaintenanceException):
    return templates.TemplateResponse("maintenance.html",
                                      context={
                                          "staging": os.getenv("STAGING"),
                                          "request": request,
                                          "quote": random_quote(),
                                          "night_mode": request.cookies.get('night_mode'),
                                          "message": exc.message
                                      })


# @app.on_event("startup")
# async def startup_event():
#     pass


@app.on_event("shutdown")
async def shutdown_event():
    while app.state.tasks:
        task = app.state.tasks.pop()
        task.cancel()
        try:
            await task
        except asyncio.CancelledError:
            pass


@app.get("/")
async def root(request: Request):
    return templates.TemplateResponse("splash.html",
                                      context={
                                          "ts": int(datetime.utcnow().timestamp()),
                                          "staging": os.getenv("STAGING"),
                                          "request": request,
                                          "quote": random_quote(),
                                          "token_gate_contract_address": "0xD64f26Bcf78df919D587b6743fcFf5b155815bd6",
                                          "night_mode": request.cookies.get('night_mode')
                                      })


@app.get("/splash")
async def splash(request: Request):
    return templates.TemplateResponse("splash.html",
                                      context={
                                          "ts": int(datetime.utcnow().timestamp()),
                                          "staging": os.getenv("STAGING"),
                                          "request": request,
                                          "quote": random_quote(),
                                          "night_mode": request.cookies.get('night_mode')
                                      })


@app.get("/quote")
async def quote(request: Request):
    return templates.TemplateResponse("quote.html",
                                      context={
                                          "ts": int(datetime.utcnow().timestamp()),
                                          "staging": os.getenv("STAGING"),
                                          "request": request,
                                          "quote": random_quote(),
                                          "night_mode": request.cookies.get('night_mode')
                                      })


@app.get("/search")
async def search(request: Request):
    return templates.TemplateResponse("search.html",
                                      context={
                                          "ts": int(datetime.utcnow().timestamp()),
                                          "staging": os.getenv("STAGING"),
                                          "request": request,
                                          "quote": random_quote(),
                                          "night_mode": request.cookies.get('night_mode')
                                      })


@app.get("/channels")
async def channels(request: Request):
    # TODO: check if session_id exists and get which channels the user can access
    return templates.TemplateResponse("channels.html",
                                      context={
                                          "ts": int(datetime.utcnow().timestamp()),
                                          "staging": os.getenv("STAGING"),
                                          "request": request,
                                          "quote": random_quote(),
                                          "night_mode": request.cookies.get('night_mode')
                                      })


@app.get("/tokens")
async def tokens(request: Request, database: Session = Depends(db.get_db)):
    response = templates.TemplateResponse("tokens.html",
                                          context={
                                              "ts": int(datetime.utcnow().timestamp()),
                                              "staging": os.getenv("STAGING"),
                                              "request": request,
                                              "quote": random_quote(),
                                              "token_gate_contract_address": "0xD64f26Bcf78df919D587b6743fcFf5b155815bd6",
                                              "night_mode": request.cookies.get('night_mode')
                                          })
    return response


@app.get("/whitepaper")
async def whitepaper(request: Request):
    return templates.TemplateResponse("whitepaper.html",
                                      context={
                                          "ts": int(datetime.utcnow().timestamp()),
                                          "staging": os.getenv("STAGING"),
                                          "request": request,
                                          "quote": random_quote(),
                                          "night_mode": request.cookies.get('night_mode')
                                      })


@app.get("/chat")
async def chat(request: Request, session: Session = Depends(get_session), database: Session = Depends(db.get_db), maintenance: bool = Depends(maintenance_mode)):
    if session and 'SECRET' in session.tags and "1" in request.query_params.keys() and request.query_params["1"] == "1":
        channels = [c.channel for c in await db.get_entries(database, "irc_channels")]
        namespace = "$secret:"
    else:
        channels_hidden = [] if 'sus' not in request.query_params else get_json_from_file("{}/config/hide_channels.json", '[]')
        channels = [c.channel for c in await db.get_entries(database, "irc_channels") if c.channel not in channels_hidden]
        namespace = "public:"
    channels.sort()
    return templates.TemplateResponse("chat-real.html",
                                      context={
                                          "ts": int(datetime.utcnow().timestamp()),
                                          "staging": os.getenv("STAGING"),
                                          "request": request,
                                          "quote": random_quote(),
                                          "namespace": namespace,
                                          "channels": channels,
                                          "night_mode": request.cookies.get('night_mode')
                                      })


if __name__ == "__main__":
    print("-" * 50)
    print("IRC Layer - Web UI")
    print("-" * 50)
    logging.info("Start!!")
    uvicorn.run(app, host=os.getenv("WEB_SERVER_HOST"), port=int(os.getenv("WEB_SERVER_PORT")))
