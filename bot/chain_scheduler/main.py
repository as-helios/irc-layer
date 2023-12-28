import sys

import pytz
import requests
from apscheduler.executors.asyncio import AsyncIOExecutor
from apscheduler.executors.pool import ThreadPoolExecutor, ProcessPoolExecutor
from apscheduler.jobstores.redis import RedisJobStore
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from dotenv import load_dotenv
from sqlalchemy.exc import IntegrityError
from web3.exceptions import ABIEventFunctionNotFound, Web3Exception, ContractLogicError

from common import *
from custom import *

load_dotenv()
worksheet_folder = "{0}/worksheet".format(os.getenv("DATA_FOLDER"))
os.makedirs(worksheet_folder, exist_ok=True)
log_file = "{}/chain_scheduler.log".format(worksheet_folder)
logging.basicConfig(
    format='%(asctime)s %(name)s %(levelname)s %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S',
    level=logging.INFO,
    handlers=[
        logging.FileHandler(log_file),
        logging.StreamHandler(sys.stdout)
    ]
)
logging.getLogger('apscheduler').setLevel(logging.INFO)

blocks_folder = "{}/blocks".format(os.getenv('DATA_FOLDER'))
sheet, sheet_data = get_spreadsheet(sys.argv[1], worksheet_folder)
database = db.SessionLocal()
abi_cache, cell_cache = {}, {}
web3 = get_web3(sheet_data['rpc_servers'])

jobstores = {
    'default': RedisJobStore(jobs_key='chain_analysis_jobs013', run_times_key='chain_analysis_running013', host=os.getenv('REDIS_HOST'), port=6379)
}
executors = {
    'default': AsyncIOExecutor(),
    'database': ThreadPoolExecutor(90),  # max threads: 90
    'processpool': ProcessPoolExecutor(60)  # max processes 20
}
scheduler = AsyncIOScheduler(executors=executors, jobstores=jobstores, timezone=pytz.utc)


async def get_transactions(stage):
    if stage in ('contracts', 'supply', 'liquidity',):
        filters = []
        if stage == 'contracts':
            filters.append(["contract_address", "is_not", None])
        transactions = await db.get_entries(database, "pulsechain_transactions", sort_by='block_number', sort_order='asc', filters=filters, amount=0, columns=["hash"])
        transactions = [t[0] for t in transactions]
        filters.extend([["processed_{}_at".format(stage), "is_not", None], ["spreadsheet_id", "==", sheet_data['id']]])
        transactions_processed = await db.get_entries(database, "pulsechain_transactions_processed", sort_by='block_number', sort_order='asc', filters=filters, amount=0, columns=["hash"])
        transactions_processed = [t[0] for t in transactions_processed]
        return get_list_diff(transactions, transactions_processed)
    return []


async def get_blocks(stage='fetch'):
    blocks = []
    columns = ['number']
    match stage:
        case 'fetch':
            block_numbers = await db.get_entries(database, "pulsechain_blocks", sort_by='number', sort_order='asc', columns=columns)
            block_numbers = [b[0] for b in block_numbers]
            all_blocks = generate_number_list(sheet_data['start_block'] - 1, web3.eth.get_block('latest').number)
            blocks.extend(get_list_diff(all_blocks, block_numbers))
        case 'unprocessed':
            filters = [["processed", "is_not", True]]
            block_numbers = await db.get_entries(database, "pulsechain_blocks", sort_by='number', sort_order='asc', filters=filters, columns=columns)
            blocks = [b[0] for b in block_numbers]
    return blocks


async def collect_block_from_rpc(web3, number):
    try:
        block = web3.eth.get_block(number)
    except Exception as e:
        logging.error(e)
        return False
    try:
        with open("{}/{}.pkl".format(blocks_folder, number), 'wb') as pickle_file:
            pickle.dump(block, pickle_file)
    except FileNotFoundError:
        return block
    else:
        write_to_file(number, "{}/last_block.txt".format(os.getenv("DATA_FOLDER")))
        return block


async def collect_blocks(number):
    print("Collecting block {}...".format(number))
    # check if block exists in db or else local or else rpc
    if block := await db.get_entries(database, "pulsechain_blocks", [["number", "==", number]], 1):
        block = block.__dict__
        print("BLOCK DB FOUND")
        if block['data']: return
    elif block := collect_block_from_local(blocks_folder, number):
        print("BLOCK LOCAL FOUND")
        pass
    elif block := await collect_block_from_rpc(web3, number):
        print("BLOCK RPC GET")
        pass
    else:
        return logging.error("Failed to get block {}!!".format(number))
    block = block.__dict__
    payload = {
        "hash": block['hash'].hex(),
        "number": block['number'],
        "data": normalize_json(block),
        "processed": False,
        "mined_at": datetime.fromtimestamp(block['timestamp']),
        "created_at": datetime.utcnow()
    }
    await db.write_entry(database, "pulsechain_blocks", payload)


async def collect_transactions(number):
    logging.debug("Collecting transactions from block {}...".format(number))
    # check if block exists in db or else local or else rpc
    if not (block := await db.get_entries(database, "pulsechain_blocks", [["number", "==", number]], 1)):
        return logging.error("Failed to get transactions for block {} from DB!!".format(number))
    else:
        block = block.__dict__
        logging.debug("BLOCK DB FOUND")
    # save all tx from the block to  transactions table
    for transaction in block['data']['transactions']:
        tx_receipt = web3.eth.get_transaction_receipt(transaction).__dict__
        tx = web3.eth.get_transaction(transaction).__dict__
        payload = {
            "hash": tx['hash'].hex(),
            "block_number": tx_receipt['blockNumber'],
            "data": normalize_json(tx),
            "receipt": normalize_json(tx_receipt),
            "from_address": tx_receipt['from'],
            "to_address": tx_receipt['to'],
            "contract_address": tx_receipt['contractAddress'],
            "mined_at": block['mined_at'],
            "created_at": datetime.utcnow()
        }
        await db.write_or_dont(database, "pulsechain_transactions", payload, [["hash", "==", tx['hash'].hex()]])
    await db.edit_entries(database, "pulsechain_blocks", {"processed": True}, [["number", "==", number]])


async def push_spreadsheet_cells():
    spreadsheet_cells = await db.get_entries(database, "spreadsheet_cells", [["spreadsheet_id", "==", sheet_data['id']]])
    batch = []
    for cell in spreadsheet_cells:
        spreadsheet_cell = Cell(cell.x, cell.y)
        spreadsheet_cell.value = cell.value
        if cell.a1 in cell_cache.keys() and cell_cache[cell.a1] == spreadsheet_cell:
            continue
        else:
            batch.append(spreadsheet_cell)
    if batch:
        # TODO: do cell formatting check based on specified columns
        sheet.update_cells(batch, value_input_option='USER_ENTERED')


async def fetch_dexscreener_data():
    if not is_dexscreener_active(sys.argv[1]):
        return logging.debug("Dexscreener updates are currently disabled.")
    r = 2
    batch = {}
    for row in sheet.get_all_records():
        response = requests.get("https://api.dexscreener.com/latest/dex/tokens/" + row['Contract Address'])
        print("Searching for pairs belonging to {}".format(row['Contract Address']))
        try:
            pairs = response.json()['pairs']
        except Exception as e:
            logging.error(response.text)
            logging.error(e)
            await asyncio.sleep(1)
            continue

        found_pair = {}
        for pair in pairs:
            if pair['baseToken']['address'] == row['Contract Address'] and pair['quoteToken']['address'] == "0xA1077a294dDE1B09bB078844df40758a5D0f9a27":
                found_pair = pair
                break

        if found_pair:
            try:
                row['Price PLS'] = found_pair['priceNative']
                row['Price USD'] = found_pair['priceUsd']
                row['Market Cap'] = float(found_pair['priceUsd']) * float(row['Current Supply'])
            except Exception as e:
                logging.error(e)
                row['Price PLS'] = "?"
                row['Price USD'] = "?"
                row['Market Cap'] = "?"

            try:
                row['FDV'] = found_pair['fdv']
            except Exception as e:
                logging.error(e)
                row['FDV'] = "?"

            try:
                row['Price Change 5m'] = "{}%".format(found_pair['priceChange']['m5'])
                row['Price Change 1h'] = "{}%".format(found_pair['priceChange']['h1'])
                row['Price Change 6h'] = "{}%".format(found_pair['priceChange']['h6'])
                row['Price Change 1D'] = "{}%".format(found_pair['priceChange']['h24'])
            except Exception as e:
                logging.error(e)
                row['Price Change 5m'] = "?"
                row['Price Change 1h'] = "?"
                row['Price Change 6h'] = "?"
                row['Price Change 1D'] = "?"
            row['Last Updated'] = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
            batch.update(form_dexscreener_cells(row, r, {"horizontalAlignment": "RIGHT"}))
        else:
            row['Price PLS'] = "-"
            row['Price USD'] = "-"
            row['Market Cap'] = "-"
            row['FDV'] = "-"
            row['Price Change 5m'] = "-"
            row['Price Change 1h'] = "-"
            row['Price Change 6h'] = "-"
            row['Price Change 1D'] = "-"
            row['Last Updated'] = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
            batch.update(form_dexscreener_cells(row, r, {"horizontalAlignment": "CENTER"}))

        r += 1
        await asyncio.sleep(1)
    await save_spreadsheet_cells_to_db(database, batch, sheet_data['id'])


async def import_token_contract(address, transaction_hash, db_only=True):
    contract_data = await get_contract_data(address, 'smart-contracts')
    token_data = await get_contract_data(address, 'tokens')
    if transaction_hash and (transaction := web3.eth.get_transaction(transaction_hash)):
        transaction = transaction.__dict__
        await collect_blocks(transaction['blockNumber'])
        await collect_transactions(transaction['blockNumber'])
        block = web3.eth.get_block(transaction['blockNumber'])
        mined_at = datetime.fromtimestamp(block.timestamp).isoformat()
    else:
        transaction = None
        mined_at = None
    entry = {
        "address": address,
        "block_number": transaction['blockNumber'] if transaction else None,
        "transaction_hash": transaction_hash or None,
        "deployer_address": transaction['from'] if transaction else None,
        "name": contract_data['name'] if contract_data else None,
        "abi": contract_data['abi'] if contract_data else None,
        "is_verified": contract_data['is_verified'] if contract_data else None,
        "is_token": True if token_data else False,
        "token_name": token_data['name'],
        "token_symbol": token_data['symbol'],
        "token_decimals": token_data['decimals'],
        "token_supply": token_data['total_supply'],
        "deployed_at": mined_at if transaction_hash else None,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    await db.write_or_dont(database, "pulsechain_contracts", entry, [["address", "==", address]])


async def check_for_new_contracts(transaction_hash, db_only=True):
    if not (transaction := await db.get_entries(database, "pulsechain_transactions", [["hash", "==", transaction_hash]], 1)):
        return logging.error("Failed to get transaction hash {} from DB!!".format(transaction_hash))
    else:
        transaction = transaction.__dict__
    batch = {}
    current_timestamp = datetime.utcnow()
    for wallet_label, wallet_address in sheet_data['deployers'].items():
        # check if from dev wallet with any contract address
        if web3.to_checksum_address(wallet_address) == web3.to_checksum_address(transaction['from_address']) and transaction['contract_address']:
            if (contract_data := await get_contract_data(transaction['contract_address'])) and contract_data['abi']:
                contract_abi = contract_data['abi']
                if transaction['contract_address'] not in abi_cache.keys():
                    abi_cache[transaction['contract_address']] = contract_abi
                contract_name = contract_data['name'] if 'name' in contract_data.keys() and contract_data['name'] else None
            else:
                contract_abi = None
                contract_name = None
            contract_abi = contract_abi or guess_contract_abi(web3, transaction['contract_address']) or None
            entry = {
                "address": transaction['contract_address'],
                "block_number": transaction['block_number'],
                "transaction_hash": transaction_hash,
                "deployer_address": transaction['from_address'],
                "name": contract_name,
                "abi": contract_abi,
                "is_verified": True if contract_abi else False
            }
            # check if it's a token address
            contract = web3.eth.contract(transaction['contract_address'], abi=contract_abi or token_abi())
            try:
                token_name = contract.functions.name().call()
                token_symbol = contract.functions.symbol().call()
                token_decimals = contract.functions.decimals().call()
                token_supply = contract.functions.totalSupply().call()
                # cell_cache[transaction['contract_address']] = {'decimals': token_decimals, 'cell_list': sheet.findall(transaction['contract_address'], in_column=3)}
            except ContractLogicError as e:
                logging.error(e)
                entry['is_token'] = False
            except Web3Exception as e:
                logging.error(e)
                if not web3.is_connected():
                    await asyncio.sleep(30)
                # TODO: switch to celery and requeue at the front
                return await check_for_new_contracts(transaction_hash)
            else:
                entry.update({
                    "is_token": True,
                    "token_name": token_name,
                    "token_symbol": token_symbol,
                    "token_decimals": token_decimals,
                    "token_supply": token_supply,
                    "deployed_at": transaction['mined_at'],
                    "created_at": current_timestamp,
                    "updated_at": current_timestamp
                })
            finally:
                entry.update({
                    "deployed_at": transaction['mined_at'],
                    "created_at": current_timestamp,
                    "updated_at": current_timestamp
                })

            if entry['is_token']:
                # get initial minted supply or default to current token supply
                token_supply_tx = None
                for log in transaction['receipt']['logs']:
                    if log['data'] == "0x":
                        continue
                    else:
                        token_supply_tx = int(log['data'], 16)
                        break
                token_supply_tx = token_supply_tx or token_supply
                entry['token_supply_initial'] = token_supply_tx
                try:
                    await db.write_or_dont(database, "pulsechain_contracts", entry, [["address", "==", transaction['contract_address']]])
                except IntegrityError:
                    pass
                # proceed to queue spreadsheet changes
            else:
                try:
                    await db.write_or_dont(database, "pulsechain_contracts", entry, [["address", "==", transaction['contract_address']]])
                except IntegrityError:
                    pass
                finally:
                    await db.edit_or_write(database, "pulsechain_transactions_processed", {"hash": transaction_hash, "contract_address": transaction['contract_address'] if 'contract_address' in transaction.keys() else None, "processed_contracts_at": datetime.utcnow(), "spreadsheet_id": sheet_data['id']}, [["hash", "==", transaction_hash], ["spreadsheet_id", "==", sheet_data['id']]])
                    # look for new contracts
                    continue

            # prepare payload for irc feed
            if sheet_data['irc_channel_name']:
                payload = copy.deepcopy(entry)
                payload.update({
                    "contract_address": transaction['contract_address'],
                    "type": "new_token",
                    "irc_channel_name": sheet_data['irc_channel_name'],
                    "message": "[{}] New Token: {} ({}) @ {}".format(
                        transaction_hash,
                        token_name,
                        token_symbol,
                        transaction['contract_address']
                    )
                })
                await db.write_entry(database, "chain_discovery_payloads", payload)

            row_data = [
                token_name,
                token_symbol,
                "=HYPERLINK(\"{0}/address/{1}\", \"{1}\")".format(sheet_data['blockscan_url'], transaction['contract_address']),
                "=HYPERLINK(\"{0}/address/{1}\", \"{2}\")".format(sheet_data['blockscan_url'], transaction['from_address'], wallet_label),
                "=HYPERLINK(\"{0}/block/{1}\", \"{1}\")".format(sheet_data['blockscan_url'], transaction['block_number']),
                "=HYPERLINK(\"{0}/tx/{1}\", \"{2}\")".format(sheet_data['blockscan_url'], transaction['hash'], transaction['mined_at'].strftime("%Y-%m-%d %H:%M:%S")),
                str(cast_as_integer_if_zeros(format_supply(token_supply_tx, token_decimals))),  # initial token supply on deploy
                str(cast_as_integer_if_zeros(format_supply(token_supply, token_decimals))),  # current token supply
                "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-"
            ]
            row_number = await insert_and_fetch_spreadsheet_row(sheet, transaction, row_data)
            cell_formatting_left = {"horizontalAlignment": "LEFT"}
            cell_formatting_center = {"horizontalAlignment": "CENTER"}
            batch["1_{0}".format(row_number)] = [row_data[0], cell_formatting_center]  # token name
            batch["2_{0}".format(row_number)] = [row_data[1], cell_formatting_center]  # token symbol
            batch["3_{0}".format(row_number)] = [row_data[2], cell_formatting_left]  # contract address
            batch["4_{0}".format(row_number)] = [row_data[3], cell_formatting_center]  # deployer
            batch["5_{0}".format(row_number)] = [row_data[4], cell_formatting_center]  # block
            batch["6_{0}".format(row_number)] = [row_data[5], cell_formatting_center]  # deployed on
            cell_formatting_supply = {
                "horizontalAlignment": "RIGHT",
                "numberFormat": {
                    "type": "NUMBER",
                    "pattern": "#,##0.##################"
                }
            }
            batch["7_{0}".format(row_number)] = [row_data[6], cell_formatting_supply]  # initial supply
            batch["8_{0}".format(row_number)] = [row_data[8], cell_formatting_supply]  # current supply
            batch["9_{0}".format(row_number)] = ["=MAX(0, {} - {})".format(rowcol_to_a1(row_number, 8), rowcol_to_a1(row_number, 10)), cell_formatting_center]  # circulating supply
            batch["10_{0}".format(row_number)] = ["-", cell_formatting_center]  # burned supply
            batch["11_{0}".format(row_number)] = ["-", cell_formatting_center]  # last mint
            batch["12_{0}".format(row_number)] = ["-", cell_formatting_center]  # last burn

            batch["13_{0}".format(row_number)] = ["=IF(ISDATE(TO_DATE({0})), ROUND(TODAY() - TO_DATE({0}), 0), \"-\")".format(rowcol_to_a1(row_number, 13)), cell_formatting_center]  # days since last mint
            batch["14_{0}".format(row_number)] = ["=IF(ISDATE(TO_DATE({0})), ROUND(TODAY() - TO_DATE({0}), 0), \"-\")".format(rowcol_to_a1(row_number, 14)), cell_formatting_center]  # days since last burn

            batch["15_{0}".format(row_number)] = ["-", cell_formatting_center]  # price usd
            batch["16_{0}".format(row_number)] = ["-", cell_formatting_center]  # price pls
            batch["17_{0}".format(row_number)] = ["-", cell_formatting_center]  # market cap
            batch["18_{0}".format(row_number)] = ["-", cell_formatting_center]  # fdv
            batch["19_{0}".format(row_number)] = ["-", cell_formatting_center]  # price change 5m
            batch["20_{0}".format(row_number)] = ["-", cell_formatting_center]  # price change 1h
            batch["21_{0}".format(row_number)] = ["-", cell_formatting_center]  # price change 6h
            batch["22_{0}".format(row_number)] = ["-", cell_formatting_center]  # price change 1D
            batch["23_{0}".format(row_number)] = ["-", cell_formatting_center]  # price last updated
            await save_spreadsheet_cells_to_db(database, batch, sheet_data['id'])
    await db.edit_or_write(database, "pulsechain_transactions_processed", {"hash": transaction_hash, "contract_address": transaction['contract_address'] if 'contract_address' in transaction.keys() else None, "processed_contracts_at": datetime.utcnow(), "spreadsheet_id": sheet_data['id']}, [["hash", "==", transaction_hash], ["spreadsheet_id", "==", sheet_data['id']]])


async def check_for_supply_change(transaction_hash):
    if not (transaction := await db.get_entries(database, "pulsechain_transactions", [["hash", "==", transaction_hash]], 1)):
        return logging.error("Failed to get transaction hash {} from DB!!".format(transaction_hash))
    else:
        transaction = transaction.__dict__

    batch = {}
    count = {
        "mint": 0,
        "burn": 0
    }
    for index, log in enumerate(transaction['receipt']['logs']):
        # skip if just a function call
        if len(log['topics']) == 1: continue
        # skip if not a known contract
        if not (contract_data := await db.get_entries(database, "pulsechain_contracts", [["address", "==", log['address']]], 1)):
            continue
        contract_data = db.to_dict(contract_data)
        test = '=HYPERLINK("{0}/address/{1}", "{1}")'.format(sheet_data['blockscan_url'], log['address'])
        if not (cell := await db.get_entries(database, "spreadsheet_cells", [["value", "==", test]], 1)):
            if log['address'] is not None:
                logging.error("Cell not found for {}".format(log['address']))
            continue
        row_number = cell.y
        # skip if no tokens were transferred
        if len(log['topics']) != 3: continue
        from_address = Web3.to_checksum_address(log['topics'][1])
        to_address = Web3.to_checksum_address(log['topics'][2])
        # check for mints
        cell_formatting_center = {"horizontalAlignment": "CENTER"}
        if from_address == "0x0000000000000000000000000000000000000000" and to_address == transaction['from_address']:
            logging.debug("MINT FOUND: {} ({}) [{}] {}".format(contract_data['token_name'], contract_data['token_symbol'], index, transaction_hash))
            count['mint'] += int(log['data'], 16)
            # update cell last mint tx
            batch["11_{0}".format(row_number)] = ["=HYPERLINK(\"{0}/tx/{1}\", \"{2}\")".format(sheet_data['blockscan_url'], transaction_hash, transaction['mined_at'].strftime("%Y-%m-%d %H:%M:%S")),
                                                  cell_formatting_center]

        # check for burns
        if to_address in ("0x0000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000369", "0x000000000000000000000000000000000000dEaD"):
            logging.debug("BURN FOUND: {} ({}) [{}] {}".format(contract_data['token_name'], contract_data['token_symbol'], index, transaction_hash))
            count['burn'] += int(log['data'], 16)
            # update cell last burn tx
            batch["12_{0}".format(row_number)] = ["=HYPERLINK(\"{0}/tx/{1}\", \"{2}\")".format(sheet_data['blockscan_url'], transaction_hash, transaction['mined_at'].strftime("%Y-%m-%d %H:%M:%S")),
                                                  cell_formatting_center]

        for counter in ('mint', 'burn',):
            if count[counter] > 0:
                # prepare entry for liquidity changes
                operator = counter
                entry = {
                    "block_number": transaction['block_number'],
                    "transaction_hash": transaction_hash,
                    "contract_address": contract_data['address'],
                    "token_amount": count[counter],
                    "operator": operator,
                    "mined_at": transaction['mined_at'],
                    "created_at": datetime.utcnow()
                }
                await db.edit_or_write(database, "pulsechain_supply_actions", entry, [["transaction_hash", "==", transaction['hash']], ["operator", "==", operator]])

                # prepare payload for irc feed
                if sheet_data['irc_channel_name']:
                    payload = copy.deepcopy(entry)
                    payload.update({
                        "contract_address": contract_data['address'],
                        "type": "supply_{}".format(operator),
                        "irc_channel_name": sheet_data['irc_channel_name'],
                        "message": "[{}] {}ed: {} {}".format(
                            transaction_hash,
                            operator.capitalize(),
                            contract_data['address'],
                            count[counter] / 10 ** contract_data['token_decimals'],
                            contract_data['token_symbol']
                        )
                    })
                    await db.write_entry(database, "chain_discovery_payloads", payload)

                # prepare spreadsheet cell changes
                if counter == 'mint':
                    # update current supply if mint was detected
                    contract = web3.eth.contract(transaction['contract_address'], abi=token_abi())
                    batch["8_{0}".format(row_number)] = [contract.functions.totalSupply().call()]
        await save_spreadsheet_cells_to_db(database, batch, sheet_data['id'])
    await db.edit_or_write(database, "pulsechain_transactions_processed", {"hash": transaction_hash, "contract_address": transaction['contract_address'] if 'contract_address' in transaction.keys() else None, "processed_supply_at": datetime.utcnow(), "spreadsheet_id": sheet_data['id']}, [["hash", "==", transaction['hash']], ["spreadsheet_id", "==", sheet_data['id']]])


async def check_for_liquidity_change(transaction_hash):
    if not (transaction := await db.get_entries(database, "pulsechain_transactions", [["hash", "==", transaction_hash]], 1)):
        return logging.error("Failed to get transaction hash {} from DB!!".format(transaction_hash))
    else:
        transaction = transaction.__dict__
        pairs, transaction_data = {}, {}

    # find new pairs
    for index, log in enumerate(transaction['receipt']['logs']):
        # look for interactions with watched factory contracts
        if log['address'] in sheet_data['factory_contracts'].values():
            # load factory contract for LPs
            if log['address'] not in abi_cache:
                contract_data = await get_contract_data(log['address'])
                abi_cache[log['address']] = contract_data['abi']
            factory_contract = web3.eth.contract(log['address'], abi=abi_cache[log['address']])
            try:
                events_found = factory_contract.events.PairCreated().process_receipt(unnormalize_json(transaction['receipt']))
            except ABIEventFunctionNotFound as e:
                print(str(e))
                continue
            for event in events_found:
                entry = {
                    "address": event['args']['pair'],
                    "block_number": event['blockNumber'],
                    "transaction_hash": transaction_hash,
                    "factory_address": log['address'],
                    "contract_a_address": event['args']['token0'],
                    "contract_b_address": event['args']['token1'],
                    "token_a_balance": 0,
                    "token_b_balance": 0,
                    "mined_at": transaction['mined_at'],
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }
                await db.write_entry(database, "pulsechain_pair_contracts", entry)
                pairs[event['args']['pair']] = entry
    # check if LP tokens had a committed change by looking for Mint() and Sync()
    for index, log in enumerate(transaction['receipt']['logs']):
        # get the pair contract abi from cache or db
        if log['address'] not in abi_cache:
            if log['address'] in sheet_data['factory_contracts'].values():
                abi_cache[log['address']] = pulsex_factory_abi()
            elif contract_data := await get_contract_data(log['address']):
                abi_cache[log['address']] = contract_data['abi']
            else:
                abi_cache[log['address']] = guess_contract_abi(web3, log['address'])
            if not abi_cache[log['address']]:
                break
        # check if lp tokens were synced, a sign of mint/burn
        contract = web3.eth.contract(log['address'], abi=abi_cache[log['address']])
        try:
            events_found = contract.events.Sync().process_receipt(unnormalize_json(transaction['receipt']))
        except ABIEventFunctionNotFound as e:
            continue
        for event in events_found:
            if event['address'] == log['address']:
                transaction_data['lp_tokens_synced'] = True
        # check if mint() was called from LP
        contract = web3.eth.contract(log['address'], abi=abi_cache[log['address']])
        try:
            events_found = contract.events.Mint().process_receipt(unnormalize_json(transaction['receipt']))
        except ABIEventFunctionNotFound:
            continue
        for event in events_found:
            event = event.__dict__
            if event['address'] == log['address'] and event['args']['senderOrigin'] == transaction['from_address']:
                transaction_data['lp_tokens_minted'] = True

    # end this job if no changes were found for LP tokens
    if 'lp_tokens_synced' not in transaction_data.keys():
        return await db.edit_or_write(database, "pulsechain_transactions_processed", {"hash": transaction_hash, "contract_address": transaction['contract_address'] if 'contract_address' in transaction.keys() else None, "processed_supply_at": datetime.utcnow(), "spreadsheet_id": sheet_data['id']},
                               [["hash", "==", transaction['hash']], ["spreadsheet_id", "==", sheet_data['id']]])
    # count the net change of LP tokens
    for index, log in enumerate(transaction['receipt']['logs']):
        # check if it's a token transfer from prc20 or LP
        token_contract = await db.get_entries(database, "pulsechain_contracts", [["address", "==", log['address']], ["is_token", "is", True]], 1)
        lp_token_contract = await db.get_entries(database, "pulsechain_pair_contracts", [["address", "==", log['address']]], 1)
        if not token_contract and not lp_token_contract:
            continue
        else:
            token_contract = token_contract.__dict__ if token_contract else None
            lp_token_contract = lp_token_contract.__dict__ if lp_token_contract else None
        # skip if no token sends found
        if len(log['topics']) < 3:
            break
        # check if prc20 is being sent to an LP contract
        # check if LP contract is sending back a prc20
        if token_contract and (log['topics'][1] == transaction['from_address'] or log['topics'][2] == transaction['from_address']):
            lp_token_contract = await db.get_entries(database, "pulsechain_pair_contracts", [["address", "or", [log['topics'][1], log['topics'][2]]]], 1)
            if not lp_token_contract:
                continue  # no tokens sent to/from an LP contract
            # check if pair contract is cached, try to pull from db if it isn't
            if log['topics'][2] not in pairs.keys():
                search_pairs = await db.get_entries(database, "pulsechain_pair_contracts", [["address", "==", log['topics'][2]]], 1)
                if log['topics'][1] in (search_pairs['contract_a_address'], search_pairs['contract_b_address'],):
                    pairs[log['topics'][2]] = copy.deepcopy(search_pairs.__dict__)
            # check if pair contract is cached again, fail if it isn't
            if log['topics'][2] not in pairs.keys():
                logging.error("Pair contract couldn't be cached")
                break
            # determine which token is which
            # save amount of tokens transferred
            contract_pos = 'a' if log['address'] == pairs[lp_token_contract.address]['contract_a_address'] else 'b'
            transaction_data["token_{}_address".format(contract_pos)] = log['topics'][1]
            amount = int(log['data'], 16)
            if log['topics'][2] == transaction['from_address']:
                amount = -amount
            if not "token_{}_transferred".format(contract_pos) in transaction_data.keys():
                transaction_data["token_{}_transferred".format(contract_pos)] = amount
            else:
                transaction_data["token_{}_transferred".format(contract_pos)] += amount

        # check if an LP token is being sent to it's own contract or LP contract is sending it's own tokens to a burn address
        elif lp_token_contract:
            transaction_data['pair_address'] = lp_token_contract['address']
            if 'lp_tokens_transferred' not in transaction_data.keys():
                transaction_data['lp_tokens_transferred'] = 0
            # check if LP tokens were transferred to the from_address
            # check if LP tokens were transferred from the from_address to LP
            if log['topics'][1] == transaction['from_address'] and log['topics'][2] == log['address'] or \
                    log['topics'][1] == log['address'] and log['topics'][2] == transaction['from_address']:
                # count the LP tokens being transferred
                amount = int(log['data'], 16)
                if log['topics'][1] == transaction['from_address']:
                    amount = -amount
                transaction_data['lp_tokens_transferred'] += amount

            elif log['topics'][1] == log['address'] and log['topics'][2] == '0x0000000000000000000000000000000000000000':
                transaction_data['lp_tokens_burned'] = True

    # check if liq add event meets conditions
    condition_sets = {
        "add": ['token_a_address', 'token_b_address', 'token_a_transferred', 'token_b_transferred', 'lp_tokens_synced', 'lp_tokens_transferred', 'lp_tokens_minted'],
        "remove": ['pair_address', 'lp_tokens_transferred', 'lp_tokens_burned', 'lp_tokens_synced']
    }
    operator = ''
    for set_action_type, set_conditions in condition_sets.items():
        if list(set(transaction_data.keys())) != set_conditions:
            continue
        conditions_not_met = False
        for c in set_conditions:
            if not transaction_data[c]:
                conditions_not_met = True
                break
        if conditions_not_met:
            # print("Conditions not met for liquidity {}".format(set_action_type))
            continue
        # qualifies to be posted
        operator = set_action_type
        break
    if operator:
        # prepare entry for liquidity changes
        entry = {
            "block_number": transaction['block_number'],
            "transaction_hash": transaction['hash'],
            "pair_address": transaction_data['pair_address'],
            "contract_a_address": transaction_data['token_a_address'],
            "contract_b_address": transaction_data['token_b_address'],
            "token_a_amount": transaction_data['token_a_amount'],
            "token_b_amount": transaction_data['token_b_amount'],
            "operator": operator,
            "mined_at": transaction['mined_at'],
            "created_at": datetime.utcnow(),

        }
        await db.write_entry(database, "pulsechain_liquidity_actions", entry)
        # TODO: schedule a task to trigger spreadsheet update supply/mint/burns
        # prepare payload for irc feed
        if sheet_data['irc_channel_name']:
            contracts = db.to_list_of_dict(await db.get_entries(database, "pulsechain_contracts", [["address", "or", [transaction_data['token_a_address'], transaction_data['token_b_address']]]], 2))
            contract_a = [row for row in contracts if row['address'] == transaction_data['token_a_address']][0]
            contract_b = [row for row in contracts if row['address'] == transaction_data['token_b_address']][0]
            payload = copy.deepcopy(entry)
            payload.update({
                "contract_address": transaction_data['pair_address'],
                "type": "liquidity_{}".format(operator),
                "irc_channel_name": sheet_data['irc_channel_name'],
                "message": "[{}] Liq. {}ed: {} {} + {} {}".format(
                    transaction_hash,
                    (operator[:-1] if operator == 'remove' else operator).capitalize(),
                    transaction_data['token_a_amount'] / 10 ** contract_a['token_decimals'],
                    contract_a['token_symbol'],
                    transaction_data['token_b_amount'] / 10 ** contract_b['token_decimals'],
                    contract_b['token_symbol']
                )
            })
            await db.write_entry(database, "chain_discovery_payloads", payload)
    else:
        return # print("No liquidity change detected for transaction hash {}".format(transaction_hash))
    await db.edit_or_write(database, "pulsechain_transactions_processed", {"hash": transaction_hash, "contract_address": transaction['contract_address'] if 'contract_address' in transaction.keys() else None, "processed_supply_at": datetime.utcnow(), "spreadsheet_id": sheet_data['id']}, [["hash", "==", transaction['hash']], ["spreadsheet_id", "==", sheet_data['id']]])


async def queue_blocks(function, stage):
    blocks = await get_blocks(stage)
    for i, block in enumerate(blocks):
        i += 1
        if scheduler.get_job(name := "{}_{}".format(function.__name__, block)):
            continue
        match function.__name__:
            case 'collect_blocks':
                scheduler.add_job(function, args=[block], trigger='date', name=name, next_run_time=datetime.utcnow(), coalesce=True, replace_existing=False, max_instances=1000, misfire_grace_time=86400)
            case 'collect_transactions':
                scheduler.add_job(function, args=[block], trigger='date', name=name, next_run_time=datetime.utcnow(), coalesce=True, replace_existing=False, max_instances=1000, misfire_grace_time=86400)
            case other:
                return False
        # print("Added block job {}".format(name))
        await asyncio.sleep(0)


async def queue_transactions(function, stage):
    transactions = await get_transactions(stage)
    for i, transaction_hash in enumerate(transactions):
        i += 1
        if scheduler.get_job(name := "{}_{}".format(function.__name__, transaction_hash)):
            continue
        match function.__name__:
            case 'check_for_new_contracts':
                scheduler.add_job(function, args=[transaction_hash], trigger='date', name=name, next_run_time=datetime.utcnow(), coalesce=True, replace_existing=False, max_instances=10, misfire_grace_time=86400)
            case 'check_for_supply_change':
                scheduler.add_job(function, args=[transaction_hash], trigger='date', name=name, next_run_time=datetime.utcnow(), coalesce=True, replace_existing=False, max_instances=10, misfire_grace_time=86400)
            case 'check_for_liquidity_change':
                scheduler.add_job(function, args=[transaction_hash], trigger='date', name=name, next_run_time=datetime.utcnow(), coalesce=True, replace_existing=False, max_instances=10, misfire_grace_time=86400)
            case other:
                return False
        # print("Added tx job {}".format(name))


async def main():
    # db.Base.metadata.drop_all(bind=db.engine)
    db.Base.metadata.create_all(bind=db.engine)

    if len(sys.argv) < 2:
        print("Enter a worksheet number...")
        sys.exit(1)

    # update spreadsheet headers in db
    headers = sheet.get("A1:Z1")
    headers = headers[0]
    old_columns_count = len(await db.get_entries(database, "spreadsheet_columns", [["spreadsheet_id", "==", sheet_data['id']]]))
    new_columns_count = len(headers)
    for index, column in enumerate(headers):
        index += 1
        data = {
            "letter": convert_column_number_to_letter(index),
            "number": index,
            "name": column
        }
        await db.edit_or_write(database, "spreadsheet_columns", data, [["number", "==", index], ["spreadsheet_id", "==", sheet_data['id']]])
    # clean up old columns
    if old_columns_count > new_columns_count:
        for index in list(range(new_columns_count + 1, old_columns_count + 1)):
            await db.edit_entries(database, "spreadsheet_columns", {"name": ""}, [["number", "==", index], ["spreadsheet_id", "==", sheet_data['id']]])

    # begin work scheduler
    scheduler.start()
    scheduler.add_job(queue_blocks,
                      args=[collect_blocks, 'fetch'],
                      trigger='interval', minutes=1,
                      # name="queue_collect_blocks",
                      coalesce=True, replace_existing=False,
                      max_instances=1,
                      misfire_grace_time=7 * 24 * 60 * 60)
    scheduler.add_job(queue_blocks,
                      args=[collect_transactions, 'unprocessed'],
                      trigger='interval', minutes=1,
                      # name="queue_collect_transactions",
                      coalesce=True, replace_existing=False,
                      max_instances=1,
                      misfire_grace_time=7 * 24 * 60 * 60)

    scheduler.add_job(queue_transactions,
                      args=[check_for_new_contracts, 'contracts'],
                      trigger='interval', minutes=1,
                      coalesce=True, replace_existing=False,
                      max_instances=1,
                      misfire_grace_time=7 * 24 * 60 * 60)
    scheduler.add_job(queue_transactions,
                      args=[check_for_supply_change, 'supply'],
                      trigger='interval', minutes=1,
                      coalesce=True, replace_existing=False,
                      max_instances=1,
                      misfire_grace_time=7 * 24 * 60 * 60)
    scheduler.add_job(queue_transactions,
                      args=[check_for_liquidity_change, 'liquidity'],
                      trigger='interval', minutes=1,
                      coalesce=True, replace_existing=False,
                      max_instances=1,
                      misfire_grace_time=7 * 24 * 60 * 60)
    scheduler.add_job(fetch_dexscreener_data,
                      trigger='interval', minutes=15,
                      coalesce=True, replace_existing=False,
                      max_instances=1)
    scheduler.add_job(push_spreadsheet_cells,
                      trigger='interval', minutes=20,
                      coalesce=True, replace_existing=False,
                      max_instances=1)

    while True:
        await asyncio.sleep(1)


if __name__ == '__main__':
    print("-" * 50)
    print("IRC Layer - Chain Scheduler")
    print("-" * 50)
    logging.info("Init!!")
    asyncio.run(main())