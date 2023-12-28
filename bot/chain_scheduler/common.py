import json
import os


def write_to_file(data, path):
    folder = '/'.join(path.split('/')[:-1])
    if not os.path.exists(folder) and folder != '.' and folder != '':
        os.makedirs(folder)
    with open(path, 'w') as file:
        file.write(str(data))
    return data


def read_from_file(path):
    if os.path.isfile(path):
        return "\n".join([line.strip() for line in open(path, "r+")])
    else:
        return False


def get_json_from_file(path, default='{}'):
    data = read_from_file(path)
    if not data:
        return json.loads(write_to_file(default, path))
    else:
        return json.loads(data)


def get_list_diff(list1, list2):
    list1 = set(list1)
    list2 = set(list2)
    return list(list1.difference(list2))


def generate_number_list(start, end):
    if start != end:
        return list(range(start + 1, end + 1))
    return []
