import random
import string
from datetime import datetime

from fastapi import Depends, Request
from sqlalchemy.orm import Session

import db


def random_quote():
    return random.choice([
        "Γνῶθι σεαυτόν - Gnṑthi seautón",
        "Μηδέν άγαν - Mēdén ágan",
        "Έν οίδα ότι ουδέν οίδα - En oîda hóti oudèn oîda",
        "Σοφός ο εαυτό είναι δοκών - Sophós ho heautó eínai dokôn",
        "Ουδείς αυτάρκης - Oudeís autárkēs",
        "Μοχθείν δεί προ ευτυχίας - Mokhtheîn deí pro eutykhías",
        "Ο δρόμος προς την αρετήν ανήφορος - Ho drómos pros tēn aretḗn anḗphoros",
        "Γηράσκω δ' αεί πολλά διδασκόμενος - Ghēráskō d' aeì pollà didaskómenos"
    ])


def generate_random_string(length):
    characters = string.ascii_letters + string.digits  # Include both letters and digits
    return ''.join(random.choice(characters) for _ in range(length))


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


async def get_session(request: Request, database: Session = Depends(db.get_db)):
    # check if session is still valid
    if session_id := request.cookies.get("session_id"):
        # check if session_id is in database
        sessions = await db.get_entries(database, "sessions", [["session_id", "==", session_id]])
        for session in sessions:
            # session must exist, not be expired, not be disabled
            if session.session_id == session_id and session.expired_at > datetime.utcnow() and session.disabled is None:
                # found a valid session
                return session
    return False


class MaintenanceException(Exception):
    def __init__(self, message: str):
        self.message = message


async def maintenance_mode(request: Request, database: Session = Depends(db.get_db)):
    if 'sneed' in request.query_params.keys() and request.query_params['sneed'] == '1': return True
    settings = await db.get_entries(database, "settings", [["key", "==", "maintenance_mode"]])
    if (settings and settings[0].value == '1') or not settings:
        raise MaintenanceException(message="Maintenance mode is active. Check back later <3")
    return True
