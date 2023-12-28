import hashlib
import json
import os
import random
from datetime import datetime


def write_to_file(data, path):
    folder = '/'.join(path.split('/')[:-1])
    if not os.path.exists(folder) and folder != '.' and folder != '':
        os.makedirs(folder)
    with open(path, 'w') as file:
        file.write(str(data))
    return data


def read_from_file(path, default_value=None):
    if os.path.isfile(path):
        return "\n".join([line.strip() for line in open(path, "r+")])
    elif not default_value:
        return False
    else:
        return default_value


def get_json_from_file(path, default='{}'):
    data = read_from_file(path)
    if not data:
        return json.loads(write_to_file(default, path))
    else:
        return json.loads(data)


def md5(fname):
    hash_md5 = hashlib.md5()
    with open(fname, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            hash_md5.update(chunk)
    return hash_md5.hexdigest()


def get_random_line(path):
    try:
        line = random.choice(open(path, 'rb').readlines()).strip().decode('utf-8')
    except IndexError:
        return ''
    except FileNotFoundError:
        return ''
    else:
        line = line.replace("\\r", "\r")
        line = line.replace("\\n", "\n")
        return line


def normalize_json(data, encoding='latin-1'):
    if isinstance(data, bytes):
        return data.decode(encoding)
    if isinstance(data, list):
        return [normalize_json(item) for item in data]
    if isinstance(data, tuple):
        return tuple(normalize_json(item) for item in data)
    if isinstance(data, dict):
        return {normalize_json(key): normalize_json(value) for key, value in data.items()}
    if isinstance(data, datetime):
        return data.isoformat()
    return data