import hashlib
import json
import os


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


def md5_string(text):
    hash_md5 = hashlib.md5()
    hash_md5.update(bytes(text, 'utf-8'))
    return hash_md5.hexdigest()
