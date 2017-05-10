import shutil
import tempfile
import os.path

from germanium.static import get_germanium, close_browser


def before_scenario(context, scenario):
    context.test_data_folder = tempfile.gettempdir() + '/flr-test'
    shutil.rmtree(context.test_data_folder, ignore_errors=True)
    shutil.copytree(os.path.realpath("features/test-data/"), context.test_data_folder)


def after_scenario(context, scenario):
    if 'fast_live_reload_process' in context:
        context.fast_live_reload_process.kill()
        print("PROCESS KILLED")

    if get_germanium():
        close_browser()
