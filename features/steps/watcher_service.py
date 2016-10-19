import time

from behave import *

use_step_matcher("re")


@step("the service fails with an error code")
def the_service_fails_with_an_error_code(context):
    time.sleep(2)  # the failing service dies in 3 seconds.
    context.stdout = context.fast_live_reload_process.stdout.read1(1000000).decode('utf-8')
    context.stderr = context.fast_live_reload_process.stderr.read1(1000000).decode('utf-8')
    print(context.stdout)
    print(context.stderr)


@step("the service is restarted")
def the_service_is_restarted(context):
    assert "STARTED" in context.stdout

