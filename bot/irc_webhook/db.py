import asyncio
import logging
import os
from datetime import datetime

from dotenv import load_dotenv
from sqlalchemy import create_engine, or_, func, asc, desc
from sqlalchemy.ext.automap import automap_base
from sqlalchemy.orm import Session
from sqlalchemy.orm import sessionmaker

load_dotenv()
Base = automap_base()
engine = create_engine("postgresql://{0}:{1}@{2}:5432/{3}".format(os.getenv("POSTGRES_USER"), os.getenv("POSTGRES_PASSWORD"), os.getenv("POSTGRES_HOST"), os.getenv("POSTGRES_DB")), pool_size=20, max_overflow=0)
Base.prepare(engine, reflect=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

LogEntry = Base.classes.log_entry
Settings = Base.classes.settings


def apply_query_filters(query, model, filters):
    for f in filters:
        match f[1]:
            case "==":
                query = query.filter(getattr(model, f[0]) == f[2])
            case ">=":
                query = query.filter(getattr(model, f[0]) >= f[2])
            case "<=":
                query = query.filter(getattr(model, f[0]) <= f[2])
            case ">":
                query = query.filter(getattr(model, f[0]) > f[2])
            case "<":
                query = query.filter(getattr(model, f[0]) < f[2])
            case "is":
                query = query.filter(getattr(model, f[0]).is_(f[2]))
            case "is_not":
                query = query.filter(getattr(model, f[0]).is_not(f[2]))
            case "or":
                attr = getattr(model, f[0])
                query = query.filter(or_(attr == f[2][0], attr == f[2][1]))
            case "regex":
                query = query.filter(func.regexp(getattr(model, f[0]), f[2]))
            case "string":
                query = query.filter(getattr(model, f[0]).ilike("%{}%".format(f[2])))
            case other:
                pass
    return query


async def get_entries(db: Session, table: str, filters: list = [], amount: int = 0, sort_by: str = None, sort_order: str = "desc", columns: list = []):
    model = get_model_from_table(table)
    if not columns:
        query = db.query(model)
    else:
        query = db.query(*[getattr(model, c) for c in columns])
    query = apply_query_filters(query, model, filters)
    if sort_by and hasattr(model, sort_by):
        if sort_order == 'asc':
            query = query.order_by(asc(getattr(model, sort_by)))
        else:
            query = query.order_by(desc(getattr(model, sort_by)))
    if amount not in (-1, 0, 1):
        query = query.limit(amount)
        return query.all()
    elif amount == -1:
        rows = query.all()
        return rows[0] if rows else None
    elif amount == 0:
        return query.all()
    elif amount == 1:
        rows = query.all()
        return rows[-1] if rows else None


async def edit_entries(db: Session, table: str, data: dict, filters: list = [], amount: int = 1):
    model = get_model_from_table(table)
    query = db.query(model)
    query = apply_query_filters(query, model, filters)
    if amount not in (-1, 0, 1):
        query = query.limit(amount)
        entries = query.all()
    elif amount == -1:
        entries = query.all()
        entries = [entries[0]] if entries else []
    elif amount == 0:
        entries = query.all()
    elif amount == 1:
        entries = query.all()
        entries = [entries[-1]] if entries else []
    else:
        entries = False
    if not entries:
        return False
    for i, entry in enumerate(entries):
        if amount not in (-1, 0,) and i >= amount:
            break
        for key, value in data.items():
            if hasattr(entry, key):
                setattr(entry, key, value)
    while (attempts := 0) < 3:
        try:
            db.commit()
        except Exception as e:
            logging.error(e)
            db.rollback()
            await asyncio.sleep(1)
            attempts += 1
            # raise
        else:
            break
    db.close()
    return True


async def remove_entries(db: Session, table: str, filters=None, amount: int = 1):
    if filters is None:
        filters = []
    model = get_model_from_table(table)
    query = db.query(model)
    # if not filters and amount == 0:
    #     query.delete()
    # else:
    query = apply_query_filters(query, model, filters)
    if amount not in (-1, 0, 1):
        query = query.limit(amount)
        entries = query.all()
    elif amount == -1:
        entries = query.all()
        entries = [entries[0]] if entries else []
    elif amount == 0:
        entries = query.all()
    elif amount == 1:
        entries = query.all()
        entries = [entries[-1]] if entries else []
    else:
        return False
    for i, entry in enumerate(entries):
        if amount not in (-1, 0,) and i >= amount:
            break
        db.delete(entry)
    db.commit()


async def write_entry(db: Session, table: str, data: dict):
    if type(data) is not dict:
        data = data.__dict__
    try:
        entry = {m.tables[0].name: m.class_ for m in Base.registry.mappers}[table]()
    except KeyError:
        return False
    for key, value in data.items():
        if hasattr(entry, key):
            setattr(entry, key, value)
    db.add(entry)
    while (attempts := 0) < 3:
        try:
            db.commit()
        except Exception as e:
            logging.error(e)
            db.rollback()
            await asyncio.sleep(1)
            attempts += 1
            # raise
        else:
            break
    return entry


def get_model_from_table(table_name):
    Base.registry.configure()
    try:
        return {m.tables[0].name: m.class_ for m in Base.registry.mappers}[table_name]
    except KeyError:
        return None


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class Channels:
    def __init__(self, bot_type):
        self.bot_type = bot_type
        self.channels = asyncio.run(get_entries(SessionLocal(), "irc_channels"))

    async def list_db(self):
        channels = []
        for c in self.channels:
            if self.bot_type in c.bots:
                channels.append(c.channel)
        return channels

    async def add_to_db(self, channel):
        if channel not in [c.channel for c in self.channels]:
            await write_entry(SessionLocal(), "irc_channels", {"bots": [self.bot_type], "channel": channel})
        else:
            for c in self.channels:
                if self.bot_type not in c.bots:
                    bots = c.bots
                    bots.append(self.bot_type)
                    await edit_entries(SessionLocal(), "irc_channels", {"bots": bots}, [["channel", "==", channel]])

    async def remove_from_db(self, channel):
        for c in self.channels:
            if self.bot_type in c.bots:
                bots = c.bots
                bots.remove(self.bot_type)
                await edit_entries(SessionLocal(), "irc_channels", {"bots": bots}, [["channel", "==", channel]])


class Logger:
    def __init__(self, engine):
        self.Session = sessionmaker(bind=engine)

    def _log(self, log_level, source, message, context_data=None):
        session = self.Session()
        session.add(LogEntry(log_level=log_level, source=source, message=message, context_data=context_data, timestamp=datetime.utcnow()))
        try:
            session.commit()
        except:
            session.rollback()
            raise
        session.close()

    def info(self, source, message, context_data=None):
        logging.info(message)
        self._log('INFO', source, message, context_data)

    def debug(self, source, message, context_data=None):
        logging.debug(message)
        self._log('DEBUG', source, message, context_data)

    def warning(self, source, message, context_data=None):
        logging.warning(message)
        self._log('WARNING', source, message, context_data)

    def error(self, source, message, context_data=None):
        logging.error(message)
        self._log('ERROR', source, message, context_data)

    def critical(self, source, message, context_data=None):
        logging.critical(message)
        self._log('CRITICAL', source, message, context_data)


logger = Logger(engine)
