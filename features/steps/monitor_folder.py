import fcntl
import os
import pathlib
import subprocess
import sys
import time

from behave import *

ON_POSIX = 'posix' in sys.builtin_module_names

use_step_matcher("re")


@step('I monitor the test-data folder running `pwd` whenever files change')
def monitor_the_test_data_folder_running_pwd(context):
    process = subprocess.Popen(["fast-live-reload",
                                context.test_data_folder,
                                "-e",
                                "pwd"],
                               stdout=subprocess.PIPE,
                               close_fds=ON_POSIX)

    make_process_ouptput_async(context, process)


@step('I monitor from inside the test-data folder running `pwd` whenever files change')
def monitor_the_test_data_folder_running_pwd(context):
    process = subprocess.Popen(["fast-live-reload",
                                "-e",
                                "pwd"],
                               cwd=context.test_data_folder,
                               stdout=subprocess.PIPE,
                               close_fds=ON_POSIX)

    make_process_ouptput_async(context, process)


@step(r'I monitor the test-data/test\.\* files running `pwd` whenever the file change')
def monitor_the_test_data_folder_running_pwd(context):
    monitored_path = context.test_data_folder + '/test.*'
    print("Monitored path: %s" % monitored_path)

    process = subprocess.Popen(["fast-live-reload",
                                monitored_path,
                                "-e",
                                "pwd"],
                               stdout=subprocess.PIPE)

    make_process_ouptput_async(context, process)


@step(r'I monitor inside the test-data folder for test.* files, running `pwd` whenever the file change')
def monitor_the_test_data_folder_running_pwd(context):
    monitored_path = context.test_data_folder
    print("Monitored path: %s" % monitored_path)

    process = subprocess.Popen(["fast-live-reload",
                                'test.*',
                                "-e",
                                "pwd"],
                               cwd=context.test_data_folder,
                               stdout=subprocess.PIPE)

    make_process_ouptput_async(context, process)


def make_process_ouptput_async(context, process):
    context.fast_live_reload_process = process

    # 3. wait for the fast live reload to come up:
    time.sleep(2)

    # just read the initial content
    context.fast_live_reload_process.stdout.read1(1000000).decode('utf-8')
    fd = context.fast_live_reload_process.stdout
    fl = fcntl.fcntl(fd, fcntl.F_GETFL)
    fcntl.fcntl(fd, fcntl.F_SETFL, fl | os.O_NONBLOCK)

    context.process_output_fd = fd


@step("when I change the '(.*?)' file in that folder")
@step("I change the '(.*?)' file in that folder")
def change_the_text_txt_file(context, file_name):
    pathlib.Path(context.test_data_folder + "/" + file_name).touch()
    time.sleep(1)


@step("the `pwd` command gets executed")
def check_if_the_pwd_command_was_executed(context):
    stdout = context.fast_live_reload_process.stdout.read1(1000000).decode('utf-8')
    assert 'Running: pwd' in stdout


@step("fast-live-reload doesn't do anything")
def check_that_fast_live_reload_doesnt_do_anything(context):
    result = context.fast_live_reload_process.stdout.read()
    print(result)
    assert not result
