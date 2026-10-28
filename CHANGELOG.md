# Changelog

## [1.1.1](https://github.com/sGeeK44/Clefsmith/compare/clefsmith-v1.1.0...clefsmith-v1.1.1) (2026-10-28)


### Bug Fixes

* **ci:** bound how long a job may run ([813b555](https://github.com/sGeeK44/Clefsmith/commit/813b555285158e19c7f415d133266bd84eb30256))
* **ci:** retry the pod download when the runner stalls on it ([4b248cc](https://github.com/sGeeK44/Clefsmith/commit/4b248cc76e4cd454f7895bafeb5b171bde2c2c84))
* **ci:** run the device suite only on the release pull request ([e43218f](https://github.com/sGeeK44/Clefsmith/commit/e43218f975d8081a0d51ab1e974a29d103a350e6))
* **ci:** stop the hook failing when nothing staged concerns the formatter ([7cd7c8e](https://github.com/sGeeK44/Clefsmith/commit/7cd7c8eea38b90f4f4d1e8a0a47136da8a3e3b68))

## [1.1.0](https://github.com/sGeeK44/Clefsmith/compare/clefsmith-v1.0.0...clefsmith-v1.1.0) (2026-10-28)


### Features

* **ci:** derive versions from commits with release-please (CLE-30) ([#18](https://github.com/sGeeK44/Clefsmith/issues/18)) ([cb5e4bd](https://github.com/sGeeK44/Clefsmith/commit/cb5e4bd98f878bb73dd0ad1e4abc54a1545c97c5))
* **ci:** run the acceptance scenarios on device (CLE-29) ([7c74e79](https://github.com/sGeeK44/Clefsmith/commit/7c74e79e12dfe3515eca9aeb6fc414984284c5d4))
* **ci:** run the repository's checks on every pull request (CLE-28) ([33dd55f](https://github.com/sGeeK44/Clefsmith/commit/33dd55f21ce9afeb5bb1f6cc106d87b6dabc325a))
* **container:** resolve a layered sentinel service at boot (CLE-5) ([#2](https://github.com/sGeeK44/Clefsmith/issues/2)) ([74e5bd6](https://github.com/sGeeK44/Clefsmith/commit/74e5bd64a694d1d411b325d93084db2741514942))
* **e2e:** run Gherkin acceptance scenarios on device (CLE-27) ([187326e](https://github.com/sGeeK44/Clefsmith/commit/187326efb678e818e218dc75d80104036ed5891a))
* **scaffold:** boot an Expo SDK 58 app on Expo Router (CLE-5) ([#1](https://github.com/sGeeK44/Clefsmith/issues/1)) ([2118b9b](https://github.com/sGeeK44/Clefsmith/commit/2118b9b9b5f9a78000bca72b7eede2021e9a3082))
* **tooling:** refuse a commit that fails the checks (CLE-26) ([fc6c594](https://github.com/sGeeK44/Clefsmith/commit/fc6c5947381a53d92d06c6c9cb2f2935894c99a3))
* **tooling:** report what nothing reaches (CLE-25) ([a2fa6b0](https://github.com/sGeeK44/Clefsmith/commit/a2fa6b08b8791b5cfa6f04b14ffcdb8b70da7908))


### Bug Fixes

* **ci:** give WebDriverAgent time to build and retry the NDK download (CLE-29) ([6d8e314](https://github.com/sGeeK44/Clefsmith/commit/6d8e31415facdae70a8935b2f165282fc8f52d41))
* **ci:** keep the generated changelog out of the formatter (CLE-30) ([60830d7](https://github.com/sGeeK44/Clefsmith/commit/60830d7bc321bcf61d2ae5f1980e2a928575b3e8))
* **ci:** pick a simulator model the installed runtime supports (CLE-29) ([690afab](https://github.com/sGeeK44/Clefsmith/commit/690afab25cecf0606560e11a963893e876fbc646))
* **ci:** set up the JDK after the native folder exists (CLE-29) ([09df7b6](https://github.com/sGeeK44/Clefsmith/commit/09df7b6c693dd8b24a20bb7b9feaf1e44096ddc0))
* **ci:** wait for the simulator to boot and let Appium start (CLE-29) ([2f0f183](https://github.com/sGeeK44/Clefsmith/commit/2f0f18382637764b29aba35e7500cff892ddd853))
* **deps:** restore reflect-metadata, which the container needs (CLE-25) ([199c63f](https://github.com/sGeeK44/Clefsmith/commit/199c63fb6c36a4d81a15e9e00ffabd60d3db4ca8))
* **e2e:** reinstall the app on every session (CLE-27) ([bce2bd1](https://github.com/sGeeK44/Clefsmith/commit/bce2bd160be3aafadc365b0136c83a8cc7171d33))


### Reverts

* restore the root screen, and let the simulator settle (CLE-29) ([#17](https://github.com/sGeeK44/Clefsmith/issues/17)) ([1131c5a](https://github.com/sGeeK44/Clefsmith/commit/1131c5a3a0b07c960f194b87650a6bc0fb100abc))
