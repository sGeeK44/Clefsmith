Feature: The app launches

  The scaffold wires a use case to an infrastructure port through the container.
  This scenario proves the chain resolves on a real device, not only in a bundle.

  Scenario: the root screen shows the version resolved from the container
    When the app is launched
    Then the root screen shows the application version
