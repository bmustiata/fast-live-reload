import shutil
import tempfile


def before_scenario(context, scenario):
    context.test_data_folder = tempfile.gettempdir() + '/flr-test'
    shutil.rmtree(context.test_data_folder, ignore_errors=True)
    shutil.copytree("features/test-data", context.test_data_folder)


def after_scenario(context, scenario):
    context.fast_live_reload_process.kill()
    print("PROCESS KILLED")


