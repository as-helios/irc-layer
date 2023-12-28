import asyncio
import copy
import logging
import math
import os
import pickle
import re
import time
from datetime import datetime
from decimal import getcontext, Decimal

import gspread
import httpx
import web3.eth
from gspread import Cell
from gspread.utils import rowcol_to_a1
from hexbytes import HexBytes
from oauth2client.service_account import ServiceAccountCredentials
from web3 import Web3
from web3.datastructures import AttributeDict
from web3_multi_provider import MultiProvider

import db
from common import get_json_from_file


def normalize_json(data, encoding='latin-1'):
    if hasattr(data, 'hex') and data.hex().startswith('0x000000000000000000000000') and len(data.hex()) == 66:
        return Web3.to_checksum_address("0x{}".format(data.hex()[-40:]))
    if isinstance(data, HexBytes):
        return data.hex()
    if isinstance(data, AttributeDict):
        return {normalize_json(key): normalize_json(value) for key, value in data.items()}
    if isinstance(data, datetime):
        return data.isoformat()
    if isinstance(data, bytes):
        return data.decode(encoding)
    if isinstance(data, list):
        return [normalize_json(item) for item in data]
    if isinstance(data, tuple):
        return tuple(normalize_json(item) for item in data)
    if isinstance(data, dict):
        return {normalize_json(key): normalize_json(value) for key, value in data.items()}
    return data


def unnormalize_json(data):
    if isinstance(data, list):
        return [unnormalize_json(item) for item in data]
    if isinstance(data, tuple):
        return tuple(unnormalize_json(item) for item in data)
    if isinstance(data, dict):
        return AttributeDict({key: unnormalize_json(value) if key not in ('address', 'from', 'to',) else value for key, value in data.items()})
    if type(data) is str and data.startswith('0x'):
        if len(data) == 42:
            return HexBytes("0x000000000000000000000000{}".format(data[2:]))
        else:
            return HexBytes(data)
    return data


def decode_function_call(contract, tx, matching):
    try:
        # try to decode based on provided contract abi
        decoded_input = contract.decode_function_input(tx.input)
    except ValueError:
        return False
    else:
        # decoded, looking for burn function
        match = re.search(r'<Function (\w+)\(', str(decoded_input[0]))
        if match and match.group(1) == matching:
            return True
        else:
            return False


def collect_block_from_rpc(web3, number):
    try:
        return web3.eth.get_block(number)
    except Exception as e:
        logging.error(e)
        return False


def collect_block_from_local(blocks_folder, number):
    block_file = "{}/{}.pkl".format(blocks_folder, number)
    if os.path.exists(block_file):
        with open(block_file, 'rb') as f:
            return pickle.load(f)
    return False


# async def collect_block_from_db(database, number):
#     if block := await db.get_entries(database, "pulsechain_blocks", [["number", "==", number]], 1):
#         return copy.deepcopy(block.__dict__)
#     return []


# async def collect_transaction_from_db(database, hash):
#     if tx := await db.get_entries(database, "pulsechain_transactions", [["hash", "==", hash]], 1):
#         return copy.deepcopy(tx.__dict__)
#     return []


def form_dexscreener_cells(row_data, row, formatting):
    col = 15
    cells = {}
    for column in list(row_data.keys())[14:]:
        cells["{}_{}".format(row, col)] = [row_data[column], formatting]
        col += 1
    return cells


def convert_column_number_to_letter(number):
    if number > 26:
        loops = number / 26
        remainder = number % 26
        letter = convert_column_number_to_letter(remainder)
        return "{}{}".format('A' * math.floor(loops), letter)
    else:
        return chr((number - 1) % 26 + ord('A'))


def cast_as_integer_if_zeros(number):
    number_str = str(number)
    if "." not in str(number):
        return int(number)
    integer_part, decimal_part = number_str.split(".")
    if all(char == '0' for char in decimal_part):
        return int(integer_part)
    else:
        return number


def format_supply(number, decimals):
    getcontext().prec = decimals + 1
    if len(str(number)) > 36:
        number = int(number / 10 ** decimals)
    else:
        number = Decimal(number) / Decimal(10 ** decimals)
    if str(number).endswith('.0'):
        return str(number).replace('.0', '')
    return str(number)


def token_abi():
    return [{"inputs": [], "name": "name", "outputs": [{"internalType": "string", "name": "", "type": "string"}], "stateMutability": "view", "type": "function"},
            {"inputs": [], "name": "symbol", "outputs": [{"internalType": "string", "name": "", "type": "string"}], "stateMutability": "view", "type": "function"},
            {"inputs": [], "name": "totalSupply", "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}], "stateMutability": "view", "type": "function"},
            {"inputs": [], "name": "decimals", "outputs": [{"internalType": "uint8", "name": "", "type": "uint8"}], "stateMutability": "view", "type": "function"},
            {"constant": True, "inputs": [{"internalType": "address", "name": "", "type": "address"}], "name": "balanceOf", "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
             "payable": False, "stateMutability": "view", "type": "function"},
            {"constant": False, "inputs": [{"name": "amount", "type": "uint256"}], "name": "burn", "outputs": [], "payable": False, "stateMutability": "nonpayable", "type": "function"},
            {"anonymous": False, "inputs": [{"indexed": True, "internalType": "address", "name": "from", "type": "address"}, {"indexed": True, "internalType": "address", "name": "to", "type": "address"},
                                            {"indexed": False, "internalType": "uint256", "name": "value", "type": "uint256"}], "name": "Transfer", "type": "event"}]


def pulsex_factory_abi():
    return [{"inputs": [{"internalType": "address", "name": "_feeToSetter", "type": "address"}], "type": "constructor"},
            {"constant": True, "inputs": [], "name": "INIT_CODE_PAIR_HASH", "outputs": [{"internalType": "bytes32", "name": "", "type": "bytes32"}], "stateMutability": "view", "type": "function"},
            {"constant": True, "inputs": [{"internalType": "uint256", "name": "", "type": "uint256"}], "name": "allPairs", "outputs": [{"internalType": "address", "name": "", "type": "address"}],
             "stateMutability": "view",
             "type": "function"}, {"constant": True, "inputs": [], "name": "allPairsLength", "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}], "stateMutability": "view", "type": "function"},
            {"constant": False, "inputs": [{"internalType": "address", "name": "tokenA", "type": "address"}, {"internalType": "address", "name": "tokenB", "type": "address"}], "name": "createPair",
             "outputs": [{"internalType": "address", "name": "pair", "type": "address"}], "stateMutability": "nonpayable", "type": "function"},
            {"constant": True, "inputs": [], "name": "feeTo", "outputs": [{"internalType": "address", "name": "", "type": "address"}], "stateMutability": "view", "type": "function"},
            {"constant": True, "inputs": [], "name": "feeToSetter", "outputs": [{"internalType": "address", "name": "", "type": "address"}], "stateMutability": "view", "type": "function"},
            {"constant": True, "inputs": [{"internalType": "address", "name": "", "type": "address"}, {"internalType": "address", "name": "", "type": "address"}], "name": "getPair",
             "outputs": [{"internalType": "address", "name": "", "type": "address"}], "stateMutability": "view", "type": "function"},
            {"constant": False, "inputs": [{"internalType": "address", "name": "_feeTo", "type": "address"}], "name": "setFeeTo", "outputs": [], "stateMutability": "nonpayable", "type": "function"},
            {"constant": False, "inputs": [{"internalType": "address", "name": "_feeToSetter", "type": "address"}], "name": "setFeeToSetter", "outputs": [], "stateMutability": "nonpayable", "type": "function"},
            {"anonymous": False, "inputs": [{"indexed": True, "name": "token0", "type": "address"}, {"indexed": True, "name": "token1", "type": "address"}, {"indexed": False, "name": "pair", "type": "address"},
                                            {"indexed": False, "name": "", "type": "uint256"}], "name": "PairCreated", "type": "event"}]


def pulsex_lp_abi():
    return [{"inputs": [], "payable": False, "stateMutability": "nonpayable", "type": "constructor"}, {"anonymous": False, "inputs": [{"indexed": True, "internalType": "address", "name": "owner", "type": "address"},
                                                                                                                                      {"indexed": True, "internalType": "address", "name": "spender", "type": "address"},
                                                                                                                                      {"indexed": False, "internalType": "uint256", "name": "value", "type": "uint256"}],
                                                                                                       "name": "Approval", "type": "event"}, {"anonymous": False, "inputs": [
        {"indexed": True, "internalType": "address", "name": "sender", "type": "address"}, {"indexed": False, "internalType": "uint256", "name": "amount0", "type": "uint256"},
        {"indexed": False, "internalType": "uint256", "name": "amount1", "type": "uint256"}, {"indexed": True, "internalType": "address", "name": "to", "type": "address"},
        {"indexed": True, "internalType": "address", "name": "senderOrigin", "type": "address"}], "name": "Burn", "type": "event"}, {"anonymous": False, "inputs": [
        {"indexed": True, "internalType": "address", "name": "sender", "type": "address"}, {"indexed": False, "internalType": "uint256", "name": "amount0", "type": "uint256"},
        {"indexed": False, "internalType": "uint256", "name": "amount1", "type": "uint256"}, {"indexed": True, "internalType": "address", "name": "senderOrigin", "type": "address"}], "name": "Mint", "type": "event"},
            {"anonymous": False, "inputs": [{"indexed": True, "internalType": "address", "name": "sender", "type": "address"}, {"indexed": False, "internalType": "uint256", "name": "amount0In", "type": "uint256"},
                                            {"indexed": False, "internalType": "uint256", "name": "amount1In", "type": "uint256"}, {"indexed": False, "internalType": "uint256", "name": "amount0Out", "type": "uint256"},
                                            {"indexed": False, "internalType": "uint256", "name": "amount1Out", "type": "uint256"}, {"indexed": True, "internalType": "address", "name": "to", "type": "address"}],
             "name": "Swap", "type": "event"},
            {"anonymous": False, "inputs": [{"indexed": False, "internalType": "uint112", "name": "reserve0", "type": "uint112"}, {"indexed": False, "internalType": "uint112", "name": "reserve1", "type": "uint112"}],
             "name": "Sync", "type": "event"}, {"anonymous": False,
                                                "inputs": [{"indexed": True, "internalType": "address", "name": "from", "type": "address"}, {"indexed": True, "internalType": "address", "name": "to", "type": "address"},
                                                           {"indexed": False, "internalType": "uint256", "name": "value", "type": "uint256"}], "name": "Transfer", "type": "event"},
            {"constant": True, "inputs": [], "name": "DOMAIN_SEPARATOR", "outputs": [{"internalType": "bytes32", "name": "", "type": "bytes32"}], "payable": False, "stateMutability": "view", "type": "function"},
            {"constant": True, "inputs": [], "name": "MINIMUM_LIQUIDITY", "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}], "payable": False, "stateMutability": "view", "type": "function"},
            {"constant": True, "inputs": [], "name": "PERMIT_TYPEHASH", "outputs": [{"internalType": "bytes32", "name": "", "type": "bytes32"}], "payable": False, "stateMutability": "view", "type": "function"},
            {"constant": True, "inputs": [{"internalType": "address", "name": "", "type": "address"}, {"internalType": "address", "name": "", "type": "address"}], "name": "allowance",
             "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}], "payable": False, "stateMutability": "view", "type": "function"},
            {"constant": False, "inputs": [{"internalType": "address", "name": "spender", "type": "address"}, {"internalType": "uint256", "name": "value", "type": "uint256"}], "name": "approve",
             "outputs": [{"internalType": "bool", "name": "", "type": "bool"}], "payable": False, "stateMutability": "nonpayable", "type": "function"},
            {"constant": True, "inputs": [{"internalType": "address", "name": "", "type": "address"}], "name": "balanceOf", "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}], "payable": False,
             "stateMutability": "view", "type": "function"},
            {"constant": False, "inputs": [{"internalType": "address", "name": "to", "type": "address"}, {"internalType": "address", "name": "senderOrigin", "type": "address"}], "name": "burn",
             "outputs": [{"internalType": "uint256", "name": "amount0", "type": "uint256"}, {"internalType": "uint256", "name": "amount1", "type": "uint256"}], "payable": False, "stateMutability": "nonpayable",
             "type": "function"},
            {"constant": True, "inputs": [], "name": "decimals", "outputs": [{"internalType": "uint8", "name": "", "type": "uint8"}], "payable": False, "stateMutability": "view", "type": "function"},
            {"constant": True, "inputs": [], "name": "factory", "outputs": [{"internalType": "address", "name": "", "type": "address"}], "payable": False, "stateMutability": "view", "type": "function"},
            {"constant": True, "inputs": [], "name": "getReserves", "outputs": [{"internalType": "uint112", "name": "_reserve0", "type": "uint112"}, {"internalType": "uint112", "name": "_reserve1", "type": "uint112"},
                                                                                {"internalType": "uint32", "name": "_blockTimestampLast", "type": "uint32"}], "payable": False, "stateMutability": "view",
             "type": "function"},
            {"constant": False, "inputs": [{"internalType": "address", "name": "_token0", "type": "address"}, {"internalType": "address", "name": "_token1", "type": "address"}], "name": "initialize", "outputs": [],
             "payable": False, "stateMutability": "nonpayable", "type": "function"},
            {"constant": True, "inputs": [], "name": "kLast", "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}], "payable": False, "stateMutability": "view", "type": "function"},
            {"constant": False, "inputs": [{"internalType": "address", "name": "to", "type": "address"}, {"internalType": "address", "name": "senderOrigin", "type": "address"}], "name": "mint",
             "outputs": [{"internalType": "uint256", "name": "liquidity", "type": "uint256"}], "payable": False, "stateMutability": "nonpayable", "type": "function"},
            {"constant": True, "inputs": [], "name": "name", "outputs": [{"internalType": "string", "name": "", "type": "string"}], "payable": False, "stateMutability": "view", "type": "function"},
            {"constant": True, "inputs": [{"internalType": "address", "name": "", "type": "address"}], "name": "nonces", "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}], "payable": False,
             "stateMutability": "view", "type": "function"}, {"constant": False,
                                                              "inputs": [{"internalType": "address", "name": "owner", "type": "address"}, {"internalType": "address", "name": "spender", "type": "address"},
                                                                         {"internalType": "uint256", "name": "value", "type": "uint256"}, {"internalType": "uint256", "name": "deadline", "type": "uint256"},
                                                                         {"internalType": "uint8", "name": "v", "type": "uint8"}, {"internalType": "bytes32", "name": "r", "type": "bytes32"},
                                                                         {"internalType": "bytes32", "name": "s", "type": "bytes32"}], "name": "permit", "outputs": [], "payable": False, "stateMutability": "nonpayable",
                                                              "type": "function"},
            {"constant": True, "inputs": [], "name": "price0CumulativeLast", "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}], "payable": False, "stateMutability": "view", "type": "function"},
            {"constant": True, "inputs": [], "name": "price1CumulativeLast", "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}], "payable": False, "stateMutability": "view", "type": "function"},
            {"constant": False, "inputs": [{"internalType": "address", "name": "to", "type": "address"}], "name": "skim", "outputs": [], "payable": False, "stateMutability": "nonpayable", "type": "function"},
            {"constant": False, "inputs": [{"internalType": "uint256", "name": "amount0Out", "type": "uint256"}, {"internalType": "uint256", "name": "amount1Out", "type": "uint256"},
                                           {"internalType": "address", "name": "to", "type": "address"}, {"internalType": "bytes", "name": "data", "type": "bytes"}], "name": "swap", "outputs": [], "payable": False,
             "stateMutability": "nonpayable", "type": "function"},
            {"constant": True, "inputs": [], "name": "symbol", "outputs": [{"internalType": "string", "name": "", "type": "string"}], "payable": False, "stateMutability": "view", "type": "function"},
            {"constant": False, "inputs": [], "name": "sync", "outputs": [], "payable": False, "stateMutability": "nonpayable", "type": "function"},
            {"constant": True, "inputs": [], "name": "token0", "outputs": [{"internalType": "address", "name": "", "type": "address"}], "payable": False, "stateMutability": "view", "type": "function"},
            {"constant": True, "inputs": [], "name": "token1", "outputs": [{"internalType": "address", "name": "", "type": "address"}], "payable": False, "stateMutability": "view", "type": "function"},
            {"constant": True, "inputs": [], "name": "totalSupply", "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}], "payable": False, "stateMutability": "view", "type": "function"},
            {"constant": False, "inputs": [{"internalType": "address", "name": "to", "type": "address"}, {"internalType": "uint256", "name": "value", "type": "uint256"}], "name": "transfer",
             "outputs": [{"internalType": "bool", "name": "", "type": "bool"}], "payable": False, "stateMutability": "nonpayable", "type": "function"}, {"constant": False, "inputs": [
            {"internalType": "address", "name": "from", "type": "address"}, {"internalType": "address", "name": "to", "type": "address"}, {"internalType": "uint256", "name": "value", "type": "uint256"}],
                                                                                                                                                         "name": "transferFrom",
                                                                                                                                                         "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
                                                                                                                                                         "payable": False, "stateMutability": "nonpayable",
                                                                                                                                                         "type": "function"}]


def guess_contract_abi(web3, address):
    for abi in (pulsex_factory_abi, pulsex_lp_abi, token_abi,):
        if abi.__name__ == 'pulsex_factory_abi':
            function = 'feeTo'
        elif abi.__name__ == 'pulsex_lp_abi':
            function = 'token0'
        else:
            function = 'decimals'
        contract = web3.eth.contract(address, abi=abi())
        try:
            getattr(contract.functions, function)().call()
        except Exception as e:
            logging.debug(e)
            continue
        else:
            return abi()


async def get_contract_data(contract_address, endpoint="smart-contracts"):
    async with httpx.AsyncClient() as client:
        try:
            r = await client.get("https://api.scan.pulsechain.com/api/v2/{}/{}".format(endpoint, contract_address))
        except Exception as e:
            logging.error(e)
            return {}
        if r.text == '"Internal server error"':
            return False
        response = r.json()
        if endpoint == 'tokens':
            return response
        elif 'abi' in response.keys():
            return response
        else:
            return False


async def insert_and_fetch_spreadsheet_row(sheet, transaction, row_data):
    if spreadsheet_entry := sheet.find(transaction['contract_address'], in_column=3):
        return spreadsheet_entry.row
    else:
        sheet.append_row(row_data, value_input_option='USER_ENTERED')
        return await insert_and_fetch_spreadsheet_row(sheet, transaction, row_data)


async def save_spreadsheet_cells_to_db(database, batch, spreadsheet):
    for cell in batch.items():
        x, y = cell[0].split('_')
        data = {
            "a1": rowcol_to_a1(x, y),
            "x": x,
            "y": y,
            "value": cell[1][0],
            "formatting": cell[1][1],
            "spreadsheet_id": spreadsheet
        }
        await db.edit_or_write(database, "spreadsheet_cells", data, [["x", "==", x], ["y", "==", y], ["spreadsheet_id", "==", spreadsheet]])


async def is_block_processed(database, number):
    if await db.get_entries(database, "pulsechain_blocks", [["number", "==", number], ["processed", "is", True]], 1):
        return True
    return False


def is_dexscreener_active(spreadsheet_index):
    _spreadsheets = get_json_from_file("{}/spreadsheets.json".format(os.getenv("DATA_FOLDER")))
    if not _spreadsheets[spreadsheet_index]['dexscreener']:
        return logging.debug("Dexscreener updates are currently disabled.")


def get_spreadsheet_data(sheet_key):
    spreadsheets = get_json_from_file("{}/spreadsheets.json".format(os.getenv("DATA_FOLDER")))
    return spreadsheets[sheet_key]


def get_spreadsheet(sheet_key, worksheet_folder):
    data = get_spreadsheet_data(sheet_key)
    scope = ['https://spreadsheets.google.com/feeds', 'https://www.googleapis.com/auth/drive']
    creds = ServiceAccountCredentials.from_json_keyfile_name("{}/{}".format(os.getenv('DATA_FOLDER'), data['credentials']), scope)
    client = gspread.authorize(creds)

    os.makedirs(worksheet_folder, exist_ok=True)
    try:
        print(spreadsheet_id := data['id'])
        sheet = client.open_by_key(spreadsheet_id).sheet1
    except KeyError:
        return False
    else:
        return sheet, data


def get_web3(rpc_servers):
    web3 = Web3(MultiProvider(rpc_servers))
    if not web3.is_connected():
        logging.info("Waiting for RPC...")
        time.sleep(3)
        return get_web3(rpc_servers)
    return web3


async def is_pair_address(database, contract_address):
    return len(await db.get_entries(database, "pulsechain_pair_contracts", [["address", "==", contract_address]], columns=['id'])) > 0


def write_entry_sync(database, table, data):
    logging.info("TRY WRITE_ENTRY")
    if not asyncio.run(db.write_entry(database, table, data)):
        logging.error("FAILED WRITE_ENTRY")
    else:
        logging.error("OK WRITE_ENTRY")


def write_or_dont_sync(database, table, data, filters):
    logging.info("TRY WRITE_OR_DONT")
    if not asyncio.run(db.write_or_dont(database, table, data, filters)):
        logging.error("FAILED WRITE_OR_DONT")
    else:
        logging.error("OK WRITE_OR_DONT")


def edit_or_write_sync(database, table, data, filters):
    logging.info("TRY EDIT_OR_WRITE")
    if not asyncio.run(db.edit_or_write(database, table, data, filters)):
        logging.error("FAILED EDIT_OR_WRITE")
    else:
        logging.error("OK EDIT_OR_WRITE")


def edit_or_dont_sync(database, table, data, filters):
    logging.info("TRY EDIT_OR_DONT")
    if not asyncio.run(db.edit_or_dont(database, table, data, filters)):
        logging.error("FAILED EDIT_OR_DONT")
    else:
        logging.error("OK EDIT_OR_DONT")
