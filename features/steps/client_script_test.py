import os
import shutil

from behave import *
from germanium.static import *

use_step_matcher("re")


@step("I open a browser on the '(.*?)'")
def i_open_a_browser_on_the_file(context, file):
    browser = 'chrome'
    test_host = 'localhost'

    if 'TEST_BROWSER' in os.environ:
        browser = os.environ['TEST_BROWSER']

    if 'TEST_HOST' in os.environ:
        test_host = os.environ['TEST_HOST']

    open_browser(browser)
    go_to('http://%s:9000/%s#fastLiveReloadHost=%s:9001' % (test_host, file, test_host))


@step("I have in the page the '(.*?)' present")
def check_text_present(context, text):
    wait(Text(text).exists)


@step("I change the '(.*?)' to the changed version on the filesystem")
def i_change_the_file_on_the_filesystem(context, name):
    shutil.copy2(os.path.join("features/test-data-changed", name),
                 os.path.join(context.test_data_folder, name))
