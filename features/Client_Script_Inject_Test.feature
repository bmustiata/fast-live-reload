Feature: Loading a HTML file, should reload it automatically
    when its contents is changing.

  @1
  Scenario: Changes in the HTML trigger the reloading of the page
        on the default port
    Given I monitor the test-data folder whenever files change
    And I open a browser on the 'test-file.html'
    Then I have in the page the 'original text' present
    When I change the 'test-file.html' to the changed version on the filesystem
    Then I have in the page the 'changed text' present

  @2
  Scenario: Changes in the HTML trigger the reloading of the given page when running inside the IFrame
    Given I monitor and serve the test-data folder
    And I open a browser for the iframe reload 'fast-live-reload/'
    And I go to the 'test-file.html' in the iframe input
    And I have in the iframe page the 'original text' present
    When I change the 'test-file.html' to the changed version on the filesystem
    Then I still have the 'test-file.html' in the iframe input.
    And I have in the iframe page the 'changed text' present

  @3
  Scenario: Changes in the HTML trigger the reloading of the page
        on client port 9002
    Given I monitor the test-data folder whenever files change on client port 9002
    Then there is a program listening on port 9002
    When I open a browser on the 'test-file.html'
    Then I have in the page the 'original text' present
    When I change the 'test-file.html' to the changed version on the filesystem
    Then I have in the page the 'changed text' present

