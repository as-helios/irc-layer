import os

import paramiko
from scp import SCPClient

ssh = paramiko.SSHClient()
ssh.load_system_host_keys()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

local_directory = "./"


def download_logs(logs):
    hostname = ""
    port = 22
    username = ""
    password = ""
    remote_directory = ""
    try:
        ssh.connect(hostname, port, username, password)
        with SCPClient(ssh.get_transport()) as scp:
            for log in logs:
                scp.get("{}/{}".format(remote_directory, log), "{}/{}".format(local_directory, log))
    finally:
        ssh.close()
        return True


def read_text_file(filename):
    with open(filename, 'r') as file:
        content = file.readlines()
        return [line.strip() for line in content]


def read_file_as_string(filename):
    with open(filename, 'r') as file:
        return file.read()


def write_to_file(data, path):
    folder = '/'.join(path.split('/')[:-1])
    if not os.path.exists(folder) and folder != '.' and folder != '':
        os.makedirs(folder)
    with open(path, 'w') as file:
        file.write(str(data))
    return data


channels = ("#atropa", "#pulsechain", "#atropa_logged",)
log_files = ["{}.log".format(channel) for channel in channels]
if download_logs(log_files):
    print("Logs downloaded!")

txt_files = {}
for filename in os.listdir(local_directory):
    if filename.endswith(".log"):
        if not filename[-5].isnumeric():
            continue
        if filename[:-5] not in txt_files.keys():
            txt_files[filename[:-5]] = []
        txt_files[filename[:-5]].append(filename[:-4])

for channel in channels:
    files = sorted(txt_files[channel + ".thelounge"])
    last_file = int(files[-1].split('.thelounge')[-1])
    current_file = last_file + 1
    log = read_text_file("{}/{}.thelounge{}.log".format(local_directory, channel, last_file))
    log_new = read_file_as_string("{}/{}.log".format(local_directory, channel))
    log_pruned = log_new.split(log[-1].strip())
    log_pruned = log_pruned[1].strip()
    if log_pruned:
        write_to_file(log_pruned, "{}/{}.thelounge{}.log".format(local_directory, channel, current_file))
        print("New lines detected for {}".format(channel))
    else:
        print("No new lines for {}".format(channel))

    log_pruned = log_pruned[1].strip()
    if log_pruned:
        write_to_file(log_pruned, "{}/{}.thelounge{}.log".format(local_directory, channel, current_file))
        print("New lines detected for {}".format(channel))
    else:
        print("No new lines for {}".format(channel))
