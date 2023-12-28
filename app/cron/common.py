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


def find_files(directory, suffix='.json'):
    file_list = os.listdir(directory)
    dir_list = [f for f in file_list if os.path.isdir(os.path.join(directory, f))]
    for d in dir_list:
        files = find_files(os.path.join(directory, d))
        for f in files:
            yield f

    for name in file_list:
        fullname = os.path.join(directory, name)
        if not os.path.isdir(fullname) and os.path.splitext(fullname)[1].lower() == suffix:
            yield fullname
