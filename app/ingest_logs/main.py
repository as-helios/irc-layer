import asyncio
import glob
import logging
import sys
from datetime import datetime, timedelta

from dotenv import load_dotenv

import db
from common import *

load_dotenv()
app_log_file = "{}/logs/ingest_logs.log".format(os.getenv('DATA_FOLDER'))
logging.basicConfig(
    format='%(asctime)s %(name)s %(levelname)s %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S',
    level=logging.INFO,
    handlers=[
        logging.FileHandler(app_log_file),
        logging.StreamHandler(sys.stdout)
    ]
)
database = db.SessionLocal()


async def main():
    stats = {
        "duplicates": 0,
        "skipped": 0,
        "writes": 0
    }
    skipped = []
    skipped_cause = []
    logs = []
    log_files = glob.glob(os.path.join("{}/ingest/logs/".format(os.getenv("DATA_FOLDER")), "*.json"))
    for filename in log_files:
        logs.append(filename.split('/')[-1])
    logs = sorted(logs)
    for l in logs:
        lines = get_json_from_file("{}/ingest/logs/{}".format(os.getenv("DATA_FOLDER"), l), '[]')
        for line in lines:
            try:
                line['created_at'] = line['created_at'].fromisoformat()
            except Exception:
                pass
            if 'op' in line.keys():
                table = "irc_log_messages"
                filters = [["content", "==", line['content']], ["nick", "==", line['nick'], ["channel", "==", line['channel']]]]
            elif 'modes' in line.keys():
                table = "irc_log_modes"
                filters = [["operation", "==", line['operation']], ["modes", "==", line['modes']], ["data", "==", line['data']], ["nick", "==", line['nick']], ["target", "==", line['target']]]
            elif 'event_type' in line.keys():
                table = "irc_log_events"
                filters = [["event_type", "==", line['event_type']], ["nick", "==", line['nick']], ["channel", "==", line['channel']], ["data", "==", line['data']]]
            elif 'nick_old' in line.keys():
                filters = [["nick_old", "==", line['nick_old']], ["nick_new", "==", line['nick_new']], ["channel", "==", line['channel']]]
                table = "irc_log_nick_changes"
            else:
                logging.info(line)
                sys.exit("WTF")

            intolerance = 0.25
            from_timestamp = datetime.fromisoformat(str(line['created_at']))
            to_timestamp = datetime.fromisoformat(str(line['created_at']))
            from_timestamp -= timedelta(seconds=intolerance)
            to_timestamp += timedelta(seconds=intolerance)
            filters.extend([["created_at", ">=", from_timestamp], ["created_at", "<=", to_timestamp]])
            filters.extend([["created_at", ">=", from_timestamp], ["created_at", "<=", to_timestamp]])
            write = True
            if existing := await db.get_entries(database, table, filters):
                if existing == [(None,)]:
                    pass
                else:
                    for e in existing:
                        ingesting_timestamp = datetime.fromisoformat(str(line['created_at']))
                        ingested_timestamp = datetime.fromisoformat(e.created_at.isoformat())
                        if ingesting_timestamp == ingested_timestamp:
                            skipped.append(line)
                            skipped_cause.append(e.__dict__)
                            logging.info("SKIPPING LINE: {}".format(line))
                            logging.info("SKIPPING LINE CAUSE: {}".format(e.__dict__))
                            stats['skipped'] += 1
                            write = False
                            break
            if write:
                await db.write_entry(database, table, line)
                stats['writes'] += 1

    logging.info("FINISHED!")
    logging.info(stats)
    write_to_file(json.dumps(clean_up(skipped), indent=4), "./skipped.json")
    write_to_file(json.dumps(clean_up(skipped_cause), indent=4), "./skipped_cause.json")


def clean_up(lines):
    skipped = []
    for line in lines:
        try:
            del line['_sa_instance_state']
        except Exception:
            pass
        try:
            line['created_at'] = line['created_at'].isoformat()
        except Exception:
            pass
        skipped.append(line)


if __name__ == "__main__":
    print("-" * 50)
    print("IRC Layer - Log Ingest")
    print("-" * 50)
    logging.info("Start!!")
    asyncio.run(main())
