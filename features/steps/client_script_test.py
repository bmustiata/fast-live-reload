import os
import shutil

from behave import *
from germanium.static import *

use_step_matcher("re")


def test_host():
    test_host_name = 'localhost'

    if 'TEST_HOST' in os.environ:
        test_host_name = os.environ['TEST_HOST']

    return test_host_name


def iframe_strategy(germanium, name):
    germanium.switch_to_default_content()

    if name == 'internal':
        germanium.switch_to_frame(Element("iframe").element())

    return name


@step("I open a browser on the '(.*?)'")
def i_open_a_browser_on_the_file(context, file):
    browser = 'chrome'

    if 'TEST_BROWSER' in os.environ:
        browser = os.environ['TEST_BROWSER']

    open_browser(browser, iframe_selector=iframe_strategy)
    go_to('http://%s:9000/%s#fastLiveReloadHost=%s:9001' % (test_host(), file, test_host()))


@step("I open a browser for the iframe reload '(.*?)'")
def i_open_a_browser_on_the_file(context, file):
    browser = 'chrome'

    if 'TEST_BROWSER' in os.environ:
        browser = os.environ['TEST_BROWSER']

    open_browser(browser, iframe_selector=iframe_strategy)
    go_to('http://%s:9000/%s' % (test_host(), file))



@step("I have in the page the '(.*?)' present")
def check_text_present(context, text):
    wait(Text(text).exists)


@step("I have in the iframe page the '(.*?)' present")
@iframe("internal")
def check_text_present(context, text):
    wait(Text(text).exists)


@step("I change the '(.*?)' to the changed version on the filesystem")
def i_change_the_file_on_the_filesystem(context, name):
    import time
    time.sleep(1)

    source_path = os.path.join("features/test-data-changed", name)
    dest_path = os.path.join(context.test_data_folder, name)

    print("Copying file from: %s to %s" % (source_path, dest_path))
    shutil.copy2(source_path, dest_path)

    # touch the file, to update its timestamp.
    with open(dest_path, 'a'):
        os.utime(dest_path)


@step("I go to the '(.*?)' in the iframe input")
def i_go_to_the_test_file(context, file_name):
    type_keys("<c-a><bs>http://%s:9000/%s<enter>" % (test_host(), file_name),
              InputText())


@step("I still have the '(.*?)' in the iframe input.")
def i_still_have_the_test_file_in_the_iframe_input(context, file_name):
    expected_text = 'http://%s:9000/%s' % (test_host(), file_name)
    assert expected_text == get_value(InputText)