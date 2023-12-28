import logging
import sys
import time
from datetime import datetime

import uvicorn
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from dotenv import load_dotenv
from fastapi import FastAPI, Depends
from sqlalchemy import text

import db
from common import *

load_dotenv()
log_file = "{}/logs/cron.log".format(os.getenv('DATA_FOLDER'))
logging.basicConfig(
    format='%(asctime)s %(name)s %(levelname)s %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S',
    level=logging.INFO,
    handlers=[
        logging.FileHandler(log_file),
        logging.StreamHandler(sys.stdout)
    ]
)
logging.getLogger('apscheduler').setLevel(logging.ERROR)
app = FastAPI(docs_url=None, redoc_url=None)
scheduler = AsyncIOScheduler()
database = db.SessionLocal()


async def limit_decay(database, table, reset=None):
    flood_limits = await db.get_entries(database, table)
    if not flood_limits: return
    for r in flood_limits:
        if reset or r.count <= 0:
            await db.remove_entries(database, table, [["nick", "==", r.nick]])
        if r.count >= 1:
            r.count -= 1
            await db.edit_entries(database, table, {"count": r.count}, [["nick", "==", r.nick]])


async def rate_limit_decay(reset=None):
    await limit_decay(database, "irc_nick_rate_limiter", reset)


async def flood_protection_decay(reset=None):
    await limit_decay(database, "irc_nick_flood_limiter", reset)


async def i_am_alive():
    if cron_alive_timestamp := await db.get_entries(database, "settings", [["key", "==", (key := "cron_alive_timestamp")]]):
        cron_alive_timestamp[-1].value = (timestamp := time.time())
        cron_alive_timestamp[-1].created_at = datetime.fromtimestamp(timestamp)
        cron_alive_timestamp[-1].updated_at = datetime.fromtimestamp(timestamp)
        await db.edit_entries(database, "settings", cron_alive_timestamp[-1], [["id", "==", cron_alive_timestamp[-1].id]])
    else:
        await db.write_entry(database, "settings", {"key": key, "value": time.time()})


async def get_db_settings(key):
    if settings := await db.get_entries(db.SessionLocal(), "settings", [["key", "==", key]]):
        return list(settings)[-1].__dict__['value']
    else:
        return None


async def db_maintenance():
    with db.engine.connect() as conn:
        with conn.execution_options(isolation_level='AUTOCOMMIT'):
            conn.execute(text("analyze"))
            conn.execute(text("vacuum"))


@app.on_event("startup")
async def startup_event(database: db.Session = Depends(db.get_db)):
    scheduler.add_job(rate_limit_decay, trigger='interval', seconds=int(await get_db_settings("rate_limit_threshold_seconds")), coalesce=True, max_instances=1, replace_existing=True)
    scheduler.add_job(flood_protection_decay, trigger='interval', seconds=int(await get_db_settings("flood_limit_threshold_seconds")), coalesce=True, max_instances=1, replace_existing=True)
    scheduler.add_job(i_am_alive, trigger='interval', seconds=20, coalesce=True, max_instances=1)
    scheduler.add_job(db_maintenance, trigger='cron', day_of_week='mon', hour=3, minute=33)
    scheduler.start()


@app.on_event("shutdown")
async def startup_event():
    scheduler.shutdown()


@app.get("/refresh-settings")
async def refresh_settings(database: db.Session = Depends(db.get_db)):
    pass


if __name__ == "__main__":
    print("-" * 50)
    print("IRC Layer - Cron Jobs")
    print("-" * 50)
    logging.info("Start!!")
    uvicorn.run(app, host=os.getenv("WEB_SERVER_HOST"), port=int(os.getenv("WEB_SERVER_PORT")))
