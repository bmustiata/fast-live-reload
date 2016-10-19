Feature: When a watcher fails we need to restart it.

  @1
  Scenario: Test if a watcher failure triggers its restarting.
    Given I monitor the test-data folder running in parallel `/tmp/flr-test/failing_service.sh`
    When the service fails with an error code
    Then the service is restarted

  @2
  Scenario: Test if a watcher that sigsegvs triggers its restarting.
    Given I monitor the test-data folder running in parallel `/tmp/flr-test/sigsegv_service.sh`
    When the service fails with an error code
    Then the service is restarted
