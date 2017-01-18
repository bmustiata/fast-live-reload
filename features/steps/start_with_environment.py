
from behave import *
import os

use_step_matcher("re")

@step(u'I have in the current environment a variable \'(.*?)\' with value \'(.*?)\'')
def step_impl(context, name, value):
    os.environ[name] = value

