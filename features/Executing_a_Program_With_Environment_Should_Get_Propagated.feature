Feature: When having a program executed the environment of the
  execution should be correctly propagated to the client.

  @1
  Scenario: Test if executing a subprogram inherits the parent environment.
    Given I have in the current environment a variable 'FLRENVIRONMENTTEST' with value 'flr_environment_test'
    And I monitor the test-data folder running `echo $FLRENVIRONMENTTEST` whenever files change
    When I change the 'test.txt' file in that folder
    Then the 'flr_environment_test' gets printed on the display

