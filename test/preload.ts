/**
 * The single place where module mocks are registered.
 *
 * `mock.module` applied from a test file takes effect only if the target module
 * has not been imported yet, which makes the result depend on test ordering.
 * Registering here runs before any test file imports anything.
 *
 * A lint rule rejects `mock.module` anywhere else.
 */
export {};
