import logging
import pickle
import sys
import time
from datetime import datetime

from dotenv import load_dotenv
from web3 import Web3
from web3_multi_provider import MultiProvider

from common import *

load_dotenv()
log_file = "{}/logs/chain_collect_blocks.log".format(os.getenv('DATA_FOLDER'))
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
web3 = Web3(MultiProvider(["https://rpc.pulsechain.com", "https://pulsechain.publicnode.com"]))
blocks_folder = "{}/blocks".format(os.getenv('DATA_FOLDER'))
last_block_file = "{}/last_block.txt".format(os.getenv("DATA_FOLDER"))
switch_file = "{}/switch.txt".format(os.getenv("DATA_FOLDER"))
timer_file = "{}/timer.txt".format(os.getenv("DATA_FOLDER"))


def get_blocks_to_scan(last_block_file):
    last_block = int(read_from_file(last_block_file))
    latest_block = web3.eth.get_block('latest').number
    if last_block != latest_block:
        return list(range(last_block + 1, latest_block + 1))
    return []


def check_active_switch(switch_file):
    if not os.path.exists(switch_file):
        with open(switch_file, "w") as f:
            f.write("1")
        return True
    elif read_from_file(switch_file) == "0":
        return False
    else:
        return True


def collect_blocks(scan_blocks):
    if not scan_blocks: return
    i = 0
    while scan_blocks[i]:
        if not check_active_switch(switch_file):
            print("Sleeping...")
            time.sleep(3)
            continue
        number = scan_blocks[i]
        if block := collect_block(number):
            logging.info("Collected block {} with {} transactions ({})...".format(number, len(block.transactions), datetime.fromtimestamp(block.timestamp).strftime("%Y-%m-%d %H:%M:%S")))
            with open("{}/{}.pkl".format(blocks_folder, number), 'wb') as pickle_file:
                pickle.dump(block, pickle_file)
            save_to_file(number, last_block_file)
            i += 1
            try:
                scan_blocks[i]
            except IndexError:
                return
            else:
                time.sleep(float(read_from_file(timer_file)))
        else:
            logging.error("Failed to get transactions for block {}!!".format(number))
            time.sleep(10)

def collect_block(number):
    try:
        return web3.eth.get_block(number)
    except Exception as e:
        logging.error(e)
        return False


def does_block_exist(blocks, number):
    if str(number) in blocks.keys() and blocks[str(number)]:
        return True
    return False


if __name__ == '__main__':
    print("-" * 50)
    print("IRC Layer - Chain Block Collector")
    print("-" * 50)
    try:
        while True:
            scan_blocks = get_blocks_to_scan(last_block_file)
            collect_blocks(scan_blocks)
            time.sleep(5)
    except KeyboardInterrupt:
        save_to_file("1", switch_file)
        time.sleep(1)
        sys.exit(0)
