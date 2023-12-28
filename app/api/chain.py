import logging

from starlette.responses import JSONResponse
from web3 import Web3
from web3_multi_provider import MultiProvider
from eth_account.messages import defunct_hash_message

web3 = Web3(MultiProvider(["https://rpc.pulsechain.com", "https://pulsechain.publicnode.com"]))

from custom import *


async def get_token_balance(contract_address, wallet_address):
    try:
        contract = web3.eth.contract(contract_address, abi=token_abi())
    except Exception as e:
        logging.error(e)
        return JSONResponse({"error": 1, "message": e})
    token_balance = contract.functions.balanceOf(wallet_address).call()
    token_decimals = contract.functions.decimals().call()
    return {"balance": token_balance, "decimals": token_decimals}


async def check_signed_message(signed_message_content, signed_message, signed_wallet_address):
    if not signed_message or not signed_wallet_address:
        return False
    message_hash = defunct_hash_message(text=signed_message_content)
    logging.info(message_hash)
    signed_address_confirm = web3.to_checksum_address(signed_wallet_address)
    logging.info(signed_address_confirm)
    signed_address = web3.eth.account._recover_hash(message_hash, signature=signed_message)
    logging.info(signed_address)
    if signed_address != signed_address_confirm:
        return False
    return signed_address_confirm
