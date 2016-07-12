Feature: Monitoring files with a pattern should raise notifications when
  the specific files are being changed.

  @1
  Scenario: Test if changing of a file raises the event change when using absolute paths
    Given I monitor the test-data/test.* files running `pwd` whenever the file change
    When I change the 'unchanged_file.txt' file in that folder
    Then fast-live-reload doesn't do anything
    But when I change the 'test.txt' file in that folder
    Then the `pwd` command gets executed

  @2
  Scenario: Test if changing of a file raises the event change when using relative paths
    Given I monitor inside the test-data folder for test.* files, running `pwd` whenever the file change
    When I change the 'unchanged_file.txt' file in that folder
    Then fast-live-reload doesn't do anything
    But when I change the 'test.txt' file in that folder
    Then the `pwd` command gets executed

  @3
  Scenario: Test if changing of a file that is used in the execute as ${FILE}
            raises the event with the full path to the file
    Given I monitor inside the test-data folder for test.* files, running `echo my file is $FILE` whenever the file change
    When I change the 'unchanged_file.txt' file in that folder
    Then fast-live-reload doesn't do anything
    But when I change the 'test.txt' file in that folder
    Then the '/flr-test/test.txt' gets printed on the display
