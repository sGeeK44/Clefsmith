Feature: The app launches

  The scaffold wires a use case to an infrastructure port through the container.
  This scenario proves the chain resolves on a real device, not only in a bundle.

  Scenario: the settings tab shows the version resolved from the container
    When the app is launched
    And the settings tab is opened
    Then the settings screen shows the application version
