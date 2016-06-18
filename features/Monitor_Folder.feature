Feature: Monitoring a folder should raise notifications when
  files are changed inside that folder.

  Scenario: Test if changing of a file raises the event change when monitoring absolute paths
    Given I monitor the test-data folder running `pwd` whenever files change
    When I change the 'test.txt' file in that folder
    Then the `pwd` command gets executed

  Scenario: Test if changing of a file raises the event change when monitoring relative paths
    Given I monitor from inside the test-data folder running `pwd` whenever files change
    When I change the 'test.txt' file in that folder
    Then the `pwd` command gets executed
