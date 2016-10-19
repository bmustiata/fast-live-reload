import fcntl
import os
import pathlib
import subprocess
import sys
import time

from behave import *

ON_POSIX = 'posix' in sys.builtin_module_names

use_step_matcher("re")


@step('I monitor the test-data folder running `(.*?)` whenever files change')
def monitor_the_test_data_folder_running_pwd(context, command):
    process = subprocess.Popen(["fast-live-reload",
                                context.test_data_folder,
                                "-e",
                                command],
                               stdout=subprocess.PIPE,
                               stderr=subprocess.PIPE,
                               close_fds=ON_POSIX)

    make_process_ouptput_async(context, process)


@step('I monitor the test-data folder running in parallel `(.*?)`')
def monitor_the_test_data_folder_running_pwd(context, command):
    process = subprocess.Popen(["fast-live-reload",
                                context.test_data_folder,
                                "-ep",
                                command],
                               stdout=subprocess.PIPE,
                               stderr=subprocess.PIPE,
                               close_fds=ON_POSIX)

    make_process_ouptput_async(context, process)


@step('I monitor the test-data folder whenever files change')
def monitor_the_test_data_folder_running_pwd(context):
    process = subprocess.Popen(["fast-live-reload",
                                context.test_data_folder],
                               stdout=subprocess.PIPE,
                               stderr=subprocess.PIPE,
                               close_fds=ON_POSIX)

    make_process_ouptput_async(context, process)


@step('I monitor from inside the test-data folder running `(.*?)` whenever files change')
def monitor_the_test_data_folder_running_pwd(context, command):
    process = subprocess.Popen(["fast-live-reload",
                                "-e",
                                command],
                               cwd=context.test_data_folder,
                               stdout=subprocess.PIPE,
                               stderr=subprocess.PIPE,
                               close_fds=ON_POSIX)

    make_process_ouptput_async(context, process)


@step(r'I monitor the test-data/test\.\* files running `(.*?)` whenever the file change')
def monitor_the_test_data_folder_running_pwd(context, command):
    monitored_path = context.test_data_folder + '/test.*'
    print("Monitored path: %s" % monitored_path)

    process = subprocess.Popen(["fast-live-reload",
                                monitored_path,
                                "-e",
                                "pwd"],
                               stdout=subprocess.PIPE,
                               stderr=subprocess.PIPE)

    make_process_ouptput_async(context, process)


@step(r'I monitor inside the test-data folder for test.* files, running `(.*?)` whenever the file change')
def monitor_the_test_data_folder_running_pwd(context, command):
    monitored_path = context.test_data_folder
    print("Monitored path: %s" % monitored_path)

    process = subprocess.Popen(["fast-live-reload",
                                'test.*',
                                "-e",
                                command],
                               cwd=context.test_data_folder,
                               stdout=subprocess.PIPE,
                               stderr=subprocess.PIPE)

    make_process_ouptput_async(context, process)


def make_process_ouptput_async(context, process):
    context.fast_live_reload_process = process

    # 3. wait for the fast live reload to come up:
    time.sleep(2)

    # just read the initial content
    fd = context.fast_live_reload_process.stdout
    fl = fcntl.fcntl(fd, fcntl.F_GETFL)
    fcntl.fcntl(fd, fcntl.F_SETFL, fl | os.O_NONBLOCK)
    #initial_out = context.fast_live_reload_process.stdout.read1(1000000).decode('utf-8')
    initial_out = context.fast_live_reload_process.stdout.read()

    fd = context.fast_live_reload_process.stderr
    fl = fcntl.fcntl(fd, fcntl.F_GETFL)
    fcntl.fcntl(fd, fcntl.F_SETFL, fl | os.O_NONBLOCK)
    #initial_err = context.fast_live_reload_process.stderr.read1(1000000).decode('utf-8')
    initial_err = context.fast_live_reload_process.stderr.read()


@step("when I change the '(.*?)' file in that folder")
@step("I change the '(.*?)' file in that folder")
def change_the_text_txt_file(context, file_name):
    pathlib.Path(context.test_data_folder + "/" + file_name).touch()
    time.sleep(1)


@step("the `pwd` command gets executed")
def check_if_the_pwd_command_was_executed(context):
    stdout = context.fast_live_reload_process.stdout.read1(1000000).decode('utf-8')
    assert 'Running: pwd' in stdout


@step("the '(.*?)' gets printed on the display")
def check_if_the_pwd_command_was_executed(context, text):
    stdout = context.fast_live_reload_process.stdout.read1(1000000).decode('utf-8')
    if text not in stdout:
        print("\n'%s' not found in STDOUT:\n%s" % (text, stdout))
        assert False


@step("fast-live-reload doesn't do anything")
def check_that_fast_live_reload_doesnt_do_anything(context):
    result = context.fast_live_reload_process.stdout.read()
    print(result)
    assert not result
