Feature: Monitoring a folder should raise notifications when
  files are changed inside that folder.

  Scenario: Test if changing of a file raises the event change
    Given I monitor the test-data folder running `pwd` whenever files change
    When I change the 'test.txt' file in that folder
    Then the `pwd` command gets executed
