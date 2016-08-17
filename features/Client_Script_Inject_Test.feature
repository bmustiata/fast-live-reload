Feature: Loading a HTML file, should reload it automatically
    when its contents is changing.

  @1
  Scenario: Changes in the HTML trigger the reloading of the page
    Given I monitor the test-data folder whenever files change
    And I open a browser on the 'test-file.html'
    Then I have in the page the 'original text' present
    When I change the 'test-file.html' to the changed version on the filesystem
    Then I have in the page the 'changed text' present
