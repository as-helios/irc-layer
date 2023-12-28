import asyncio
import copy
import logging
import os
from datetime import datetime

from dotenv import load_dotenv
from sqlalchemy import create_engine, Column, Integer, String, DateTime, ForeignKey, Boolean, desc, func, Numeric, asc, or_, delete, and_
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Session, declarative_base, relationship
from sqlalchemy.orm import sessionmaker

load_dotenv()
Base = declarative_base()
engine = create_engine("postgresql://{0}:{1}@{2}:5432/{3}".format(os.getenv("POSTGRES_USER"), os.getenv("POSTGRES_PASSWORD"), os.getenv("POSTGRES_HOST"), os.getenv("POSTGRES_DB")))
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base.metadata.create_all(bind=engine)

"""
TABLES BASE
"""


class ApiKeys(Base):
    __tablename__ = 'api_keys'
    id = Column(Integer, primary_key=True, index=True)
    wallet_id = Column(Integer, ForeignKey("wallets.id"), default=None)
    wallet = relationship("Wallets")
    key = Column(String)
    label = Column(String, default=None)
    power = Column(Integer, default=0)
    tags = Column(JSONB, default=[])
    disabled = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Wallets(Base):
    __tablename__ = 'wallets'
    id = Column(Integer, primary_key=True, index=True)
    public_key = Column(String)
    signed_message = Column(String, default=None)
    api_keys = relationship("ApiKeys", viewonly=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Sessions(Base):
    __tablename__ = 'sessions'
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String)
    signed_message = Column(String, default=None)
    disabled = Column(Boolean, default=False)
    tags = Column(JSONB, default=[])
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    expired_at = Column(DateTime, default=None)


class Tags(Base):
    __tablename__ = 'tags'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True)
    description = Column(String, default=None)
    power = Column(Integer, default=None)
    token_contract_id = Column(Integer, ForeignKey("token_contracts.id"), nullable=False)
    token_contract = relationship("TokenContracts")
    token_amount_required = Column(Integer, nullable=False)
    disabled = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class TokenContracts(Base):
    __tablename__ = 'token_contracts'
    id = Column(Integer, primary_key=True, index=True)
    address = Column(String, nullable=False)
    name = Column(String, nullable=False)
    symbol = Column(String, nullable=False)
    decimals = Column(Integer, nullable=False)
    supply = Column(Numeric, nullable=False)
    disabled = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Settings(Base):
    __tablename__ = 'settings'
    id = Column(Integer, primary_key=True, index=True)
    key = Column(String)
    value = Column(String)
    disabled = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class LogEntry(Base):
    __tablename__ = 'log_entry'
    id = Column(Integer, primary_key=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    log_level = Column(String)
    source = Column(String)
    message = Column(String)
    context_data = Column(JSONB)
    created_at = Column(DateTime, default=datetime.utcnow)


"""
TABLES IRC
"""


class IRCNickRateLimiter(Base):
    __tablename__ = 'irc_nick_rate_limiter'
    id = Column(Integer, primary_key=True, index=True)
    nick = Column(String, unique=True)
    count = Column(Integer)


class IRCNickFloodLimiter(Base):
    __tablename__ = 'irc_nick_flood_limiter'
    id = Column(Integer, primary_key=True, index=True)
    nick = Column(String)
    count = Column(Integer)


class IRCHostmaskColor(Base):
    __tablename__ = 'irc_hostmask_color'
    id = Column(Integer, primary_key=True, index=True)
    hostname = Column(String)
    nick = Column(String)
    color_code = Column(String)


class IRCHostmaskOffenses(Base):
    __tablename__ = 'irc_hostmask_offenses'
    id = Column(Integer, primary_key=True, index=True)
    nick = Column(String)
    hostname = Column(String)
    count = Column(Integer)


class IRCHostnameOffenses(Base):
    __tablename__ = 'irc_hostname_offenses'
    id = Column(Integer, primary_key=True, index=True)
    hostname = Column(String)
    count = Column(Integer)


class IRCCustomCommands(Base):
    __tablename__ = 'irc_custom_commands'
    id = Column(Integer, primary_key=True, index=True)
    channel = Column(String)
    prefix = Column(String, nullable=False)
    command = Column(String, nullable=False)
    response = Column(JSONB, default=[], nullable=False)
    disabled = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class IRCBannedHostmasks(Base):
    __tablename__ = 'irc_banned_hostmasks'
    id = Column(Integer, primary_key=True, index=True)
    channel_id = Column(Integer, ForeignKey("irc_channels.id"))
    channel = relationship("IRCChannels", viewonly=True)
    nick = Column(String, nullable=False)
    hostname = Column(String, nullable=False)
    search_type = Column(String, nullable=False)
    disabled = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    pruned_at = Column(DateTime, default=None)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class IRCBannedNicks(Base):
    __tablename__ = 'irc_banned_nicks'
    id = Column(Integer, primary_key=True, index=True)
    channel_id = Column(Integer, ForeignKey("irc_channels.id"))
    channel = relationship("IRCChannels", viewonly=True)
    nick = Column(String, nullable=False)
    search_type = Column(String, nullable=False)
    disabled = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    pruned_at = Column(DateTime, default=None)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class IRCBannedHostnames(Base):
    __tablename__ = 'irc_banned_hostnames'
    id = Column(Integer, primary_key=True, index=True)
    channel_id = Column(Integer, ForeignKey("irc_channels.id"))
    channel = relationship("IRCChannels", viewonly=True)
    hostname = Column(String, nullable=False)
    search_type = Column(String, nullable=False)
    disabled = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    pruned_at = Column(DateTime, default=None)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class IRCBannedPhrases(Base):
    __tablename__ = 'irc_banned_phrases'
    id = Column(Integer, primary_key=True, index=True)
    channel_id = Column(Integer, ForeignKey("irc_channels.id"))
    channel = relationship("IRCChannels", viewonly=True)
    phrase = Column(String, nullable=False)
    search_type = Column(String, nullable=False)
    disabled = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    pruned_at = Column(DateTime, default=None)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class IRCNickRegistered(Base):
    __tablename__ = 'irc_nick_registered'
    id = Column(Integer, primary_key=True, index=True)
    nick = Column(String, unique=True)
    hash = Column(String, default=None)
    salt = Column(String, default=None)
    hostname = Column(String, default=None)
    username = Column(String, default=None)
    userhost = Column(String, default=None)
    mask = Column(String, default=None)
    abstaining = Column(Boolean, default=False)
    tags = Column(JSONB, default=None)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class IRCNickRegisteredOps(Base):
    __tablename__ = 'irc_nick_registered_ops'
    id = Column(Integer, primary_key=True, index=True)
    channel_id = Column(Integer, ForeignKey("irc_channels.id"))
    channel = relationship("IRCChannels", viewonly=True)
    nick_registered_id = Column(Integer, ForeignKey("irc_nick_registered.id"))
    nick_registered = relationship("IRCNickRegistered", viewonly=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class IRCNickRegisteredOpAdmonishments(Base):
    __tablename__ = 'irc_nick_registered_op_admonishments'
    id = Column(Integer, primary_key=True, index=True)
    nick_registered_id = Column(Integer, ForeignKey("irc_nick_registered.id"))
    nick_registered = relationship("IRCNickRegistered", viewonly=True)
    count = Column(Integer)


class IRCChannels(Base):
    __tablename__ = 'irc_channels'
    id = Column(Integer, primary_key=True, index=True)
    channel = Column(String, nullable=False, unique=True)
    bots = Column(JSONB, default=[])
    topic = Column(String)
    users = relationship("IRCChannelUsers", viewonly=True)
    ops = relationship("IRCChannelOps", viewonly=True)
    voices = relationship("IRCChannelVoices", viewonly=True)


class IRCChannelUsers(Base):
    __tablename__ = 'irc_channel_users'
    id = Column(Integer, primary_key=True, index=True)
    hostname = Column(String)
    username = Column(String)
    userhost = Column(String)
    nick = Column(String)
    mask = Column(String)
    channel_id = Column(Integer, ForeignKey("irc_channels.id"))
    channel = relationship("IRCChannels", viewonly=True)


class IRCChannelOps(Base):
    __tablename__ = 'irc_channel_ops'
    id = Column(Integer, primary_key=True, index=True)
    channel_id = Column(Integer, ForeignKey("irc_channels.id"))
    channel = relationship("IRCChannels", viewonly=True)
    channel_user_id = Column(Integer, ForeignKey("irc_channel_users.id"))
    channel_user = relationship("IRCChannelUsers", viewonly=True)


class IRCChannelVoices(Base):
    __tablename__ = 'irc_channel_voices'
    id = Column(Integer, primary_key=True, index=True)
    channel_id = Column(Integer, ForeignKey("irc_channels.id"))
    channel = relationship("IRCChannels", viewonly=True)
    channel_user_id = Column(Integer, ForeignKey("irc_channel_users.id"))
    channel_user = relationship("IRCChannelUsers", viewonly=True)


class IRCLogMessages(Base):
    __tablename__ = 'irc_log_messages'
    id = Column(Integer, primary_key=True, index=True)
    mask = Column(String)
    username = Column(String)
    hostname = Column(String)
    userhost = Column(String)
    nick = Column(String)
    channel = Column(String)
    content = Column(String)
    op = Column(Boolean)
    voice = Column(Boolean)
    created_at = Column(DateTime, default=datetime.utcnow)
    pruned_at = Column(DateTime, default=None)


class IRCLogEvents(Base):
    __tablename__ = 'irc_log_events'
    id = Column(Integer, primary_key=True, index=True)
    mask = Column(String)
    username = Column(String)
    hostname = Column(String)
    userhost = Column(String)
    nick = Column(String)
    channel = Column(String)
    content = Column(String)
    data = Column(String, default=None)
    event_type = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    pruned_at = Column(DateTime, default=None)


class IRCLogModes(Base):
    __tablename__ = 'irc_log_modes'
    id = Column(Integer, primary_key=True, index=True)
    mask = Column(String)
    username = Column(String)
    hostname = Column(String)
    userhost = Column(String)
    nick = Column(String)
    operation = Column(String)
    modes = Column(JSONB)
    target = Column(String)
    data = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    pruned_at = Column(DateTime, default=None)


class IRCLogNickChanges(Base):
    __tablename__ = 'irc_log_nick_changes'
    id = Column(Integer, primary_key=True, index=True)
    userhost = Column(String)
    username = Column(String)
    hostname = Column(String)
    mask_old = Column(String)
    mask_new = Column(String)
    nick_old = Column(String)
    nick_new = Column(String)
    channel = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    pruned_at = Column(DateTime, default=None)


class IRCNickRecords(Base):
    __tablename__ = 'irc_nick_records'
    id = Column(Integer, primary_key=True, index=True)
    nick = Column(String)
    mask = Column(String)
    username = Column(String)
    hostname = Column(String)
    userhost = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)


class IRCHostnameRecords(Base):
    __tablename__ = 'irc_hostname_records'
    id = Column(Integer, primary_key=True, index=True)
    hostname = Column(String)
    username = Column(String)
    userhost = Column(String)
    mask = Column(String)
    nick = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)


"""
TABLES CHAIN ANALYSIS
"""


class SpreadsheetCells(Base):
    __tablename__ = 'spreadsheet_cells'
    id = Column(Integer, primary_key=True, index=True)
    a1 = Column(String, nullable=False, unique=True)
    x = Column(Integer, nullable=False)
    y = Column(Integer, nullable=False)
    value = Column(String)
    formatting = Column(JSONB)


class PulsechainBlocks(Base):
    __tablename__ = 'pulsechain_blocks'
    id = Column(Integer, primary_key=True, index=True)
    hash = Column(String, nullable=False, unique=True)
    number = Column(Integer, nullable=False, unique=True)
    transactions = relationship("PulsechainTransactions", viewonly=True)
    data = Column(JSONB)
    mined_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)


class PulsechainTransactions(Base):
    __tablename__ = 'pulsechain_transactions'
    id = Column(Integer, primary_key=True, index=True)
    hash = Column(String, nullable=False, unique=True)
    block_id = Column(Integer, ForeignKey("pulsechain_blocks.id"))
    block = relationship("PulsechainBlocks", viewonly=True)
    data = Column(JSONB)
    from_address = Column(String)
    to_address = Column(String)
    contract_address = Column(String)
    mined_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)


class PulsechainContracts(Base):
    __tablename__ = 'pulsechain_contracts'
    id = Column(Integer, primary_key=True, index=True)
    address = Column(String, nullable=False, unique=True)
    block_id = Column(Integer, ForeignKey("pulsechain_blocks.id"))
    block = relationship("PulsechainBlocks", viewonly=True)
    tx_id = Column(Integer, ForeignKey("pulsechain_transactions.id"))
    tx = relationship("PulsechainTransactions", viewonly=True)
    deployer_address = Column(String)
    name = Column(String)
    abi = Column(JSONB)
    is_token = Column(Boolean, default=False)
    token_name = Column(String, nullable=True)
    token_symbol = Column(String, nullable=True)
    token_decimals = Column(Integer, nullable=True)
    token_supply = Column(Integer, nullable=True)
    deployed_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)


class PulsechainPairContracts(Base):
    __tablename__ = 'pulsechain_pair_contracts'
    id = Column(Integer, primary_key=True, index=True)
    address = Column(String, nullable=False, unique=True)
    block_id = Column(Integer, ForeignKey("pulsechain_blocks.id"))
    block = relationship("PulsechainBlocks", viewonly=True)
    tx_id = Column(Integer, ForeignKey("pulsechain_transactions.id"))
    tx = relationship("PulsechainTransactions", viewonly=True)
    factory_address = Column(String)
    token_a_id = Column(Integer, ForeignKey("pulsechain_contracts.id"))
    token_b_id = Column(Integer, ForeignKey("pulsechain_contracts.id"))
    token_a = relationship("PulsechainContracts", foreign_keys='PulsechainPairContracts.token_a_id', viewonly=True)
    token_b = relationship("PulsechainContracts", foreign_keys='PulsechainPairContracts.token_b_id', viewonly=True)
    token_a_balance = Column(Integer)
    token_b_balance = Column(Integer)
    mined_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)


class PulsechainLiquidityActions(Base):
    __tablename__ = 'pulsechain_liquidity_actions'
    id = Column(Integer, primary_key=True, index=True)
    block_id = Column(Integer, ForeignKey("pulsechain_blocks.id"))
    block = relationship("PulsechainBlocks", viewonly=True)
    tx_id = Column(Integer, ForeignKey("pulsechain_transactions.id"))
    tx = relationship("PulsechainTransactions", viewonly=True)
    pair_id = Column(Integer, ForeignKey("pulsechain_pair_contracts.id"))
    pair = relationship("PulsechainPairContracts", viewonly=True)
    token_a_id = Column(Integer, ForeignKey("pulsechain_contracts.id"))
    token_b_id = Column(Integer, ForeignKey("pulsechain_contracts.id"))
    token_a = relationship("PulsechainContracts", foreign_keys='PulsechainLiquidityActions.token_a_id', viewonly=True)
    token_b = relationship("PulsechainContracts", foreign_keys='PulsechainLiquidityActions.token_b_id', viewonly=True)
    token_a_amount = Column(Integer)
    token_b_amount = Column(Integer)
    operator = Column(String)
    mined_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)


class PulsechainSupplyChangeActions(Base):
    __tablename__ = 'pulsechain_supply_change_actions'
    id = Column(Integer, primary_key=True, index=True)
    block_id = Column(Integer, ForeignKey("pulsechain_blocks.id"))
    block = relationship("PulsechainBlocks", viewonly=True)
    tx_id = Column(Integer, ForeignKey("pulsechain_transactions.id"))
    tx = relationship("PulsechainTransactions", viewonly=True)
    token_id = Column(Integer, ForeignKey("pulsechain_contracts.id"))
    token = relationship("PulsechainContracts", viewonly=True)
    token_amount = Column(Integer)
    operator = Column(String)
    mined_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)


"""
FUNCTIONS
"""


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
            case "and":
                attr = getattr(model, f[0])
                query = query.filter(and_(attr == f[2][0], attr == f[2][1]))
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

        else:
            break
    db.close()
    return True


async def remove_entries(db: Session, table: str, filters=None, amount: int = 1):
    if filters is None:
        filters = []
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

        else:
            break
    return entry


async def edit_or_write(db: Session, table: str, data: dict, filters: list):
    if not await edit_or_dont(db, table, data, filters, 1):
        await write_entry(db, table, data)
    return True


async def write_or_dont(db: Session, table: str, data: dict, filters: list):
    if not (entries := await get_entries(db, table, filters)) or entries == [(None,)]:
        await write_entry(db, table, data)
        return True
    return False


async def edit_or_dont(db: Session, table: str, data: dict, filters: list, amount: int = 1):
    if (entries := await get_entries(db, table, filters)) or entries == [(None,)]:
        await edit_entries(db, table, data, filters, amount)
        return True
    return False


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


def to_list_of_dict(rows):
    cloned = []
    for row in rows:
        cloned.append(copy.deepcopy(row.__dict__))
    return cloned


class Logger:
    def __init__(self, engine):
        self.Session = sessionmaker(bind=engine)

    def _log(self, log_level, source, message, context_data=None):
        session = self.Session()
        session.add(LogEntry(log_level=log_level, source=source, message=message, context_data=context_data, timestamp=datetime.utcnow()))
        try:
            session.commit()
        except Exception:
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
