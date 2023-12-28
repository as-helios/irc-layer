import os

from dotenv import load_dotenv
from sqlalchemy import create_engine, desc, func, asc, or_
from sqlalchemy.ext.automap import automap_base
from sqlalchemy.orm import Session
from sqlalchemy.orm import sessionmaker

load_dotenv()
Base = automap_base()
engine = create_engine("postgresql://{0}:{1}@{2}:5432/{3}".format(os.getenv("POSTGRES_USER"), os.getenv("POSTGRES_PASSWORD"), os.getenv("POSTGRES_HOST"), os.getenv("POSTGRES_DB")), pool_size=20, max_overflow=0)
Base.prepare(engine, reflect=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

LogEntry = Base.classes.log_entry
IRCLogMessages = Base.classes.irc_log_messages
IRCLogModes = Base.classes.irc_log_modes
IRCLogEvents = Base.classes.irc_log_events
IRCLogNickChanges = Base.classes.irc_log_nick_changes


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
    try:
        db.commit()
    except:
        db.rollback()
        raise
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
