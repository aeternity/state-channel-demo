# Changelog

## [1.0.3](https://github.com/aeternity/state-channel-demo/compare/v1.0.0...v1.0.3) (2022-10-07)


### Features

* add channelCreateTx fee ([#126](https://github.com/aeternity/state-channel-demo/issues/126)) ([a3ffa12](https://github.com/aeternity/state-channel-demo/commit/a3ffa12434f98ddf95c5575eadfd548c6ef1ebe0))
* add debug status endpoint ([0f3a42b](https://github.com/aeternity/state-channel-demo/commit/0f3a42b6fca889f51ffa883e29f6f365cc8f1218))
* handle running out of coins ([#164](https://github.com/aeternity/state-channel-demo/issues/164)) ([f281165](https://github.com/aeternity/state-channel-demo/commit/f2811659f29dc4a427ccb077bb9610c9c5e68c75))
* optimize performance ([#143](https://github.com/aeternity/state-channel-demo/issues/143)) ([69c15de](https://github.com/aeternity/state-channel-demo/commit/69c15de9885d0315e580079207e3fca211c20913))
* re-implement mobile ([647a7bf](https://github.com/aeternity/state-channel-demo/commit/647a7bf56af33fd359dfb2cf1a788272bba4cebb))
* release 1.0.1 ([eeef526](https://github.com/aeternity/state-channel-demo/commit/eeef526a07be297bc40bc88e8b6a795b124365bf))
* release follow package.json version tag ([b40b0e3](https://github.com/aeternity/state-channel-demo/commit/b40b0e3a9cc0d65aaffa82fca42f0ad00815e792))
* seperate nodes per env config ([cdd0f63](https://github.com/aeternity/state-channel-demo/commit/cdd0f63c30a73317d5eba64ad0aa9fe4000429d6))
* **server:** console.log fatal error along with logger ([dd450c7](https://github.com/aeternity/state-channel-demo/commit/dd450c7ce70ff2b552c10d3c9dc1da58710c4246))
* specify release tag in workflow ([8a81d65](https://github.com/aeternity/state-channel-demo/commit/8a81d6550d5f0ad8ccb310ee26899f61a78e188d))
* update twitter sharing text ([5f18d01](https://github.com/aeternity/state-channel-demo/commit/5f18d013972d008de96e2400239d7ea6da0581b9))


### Bug Fixes

* handle channel timeout ([c101135](https://github.com/aeternity/state-channel-demo/commit/c10113533c177f47f20775e1fce0342bf24e776c))
* handle tx log unable to be sent ([46723cf](https://github.com/aeternity/state-channel-demo/commit/46723cf3d26193760ced69d80dc84de72367faa6))
* use ws instead of wss with deployed node ([#125](https://github.com/aeternity/state-channel-demo/issues/125)) ([35ff52f](https://github.com/aeternity/state-channel-demo/commit/35ff52f6271226d521eb9ab81ca850ae2f9d7e38))


### Miscellaneous

* maintain node logs ([c7e4e3a](https://github.com/aeternity/state-channel-demo/commit/c7e4e3a7e0b478f72d6251b392620dcea62099e2))


### Refactorings

* **client:** remove channel proxy ([dace82d](https://github.com/aeternity/state-channel-demo/commit/dace82d1c8baa3a7430d6e2e91d0b7ec1c595b5d))
* decode contract events instead of decoding w compiler ([#124](https://github.com/aeternity/state-channel-demo/issues/124)) ([a66c862](https://github.com/aeternity/state-channel-demo/commit/a66c862daeff7d80c7e64130010956445d363979))
* drop usage of HTTP compiler ([#163](https://github.com/aeternity/state-channel-demo/issues/163)) ([7bec539](https://github.com/aeternity/state-channel-demo/commit/7bec5396b243bdeaaeb79cac5c3dd6aea75fdffd))
* save results via transferFunds instead of sending an extra tx ([#147](https://github.com/aeternity/state-channel-demo/issues/147)) ([d069ce9](https://github.com/aeternity/state-channel-demo/commit/d069ce9a79c09a880de0681bb7242ccfadb7289b))
* **server:** console.log error before using logger ([560a4a3](https://github.com/aeternity/state-channel-demo/commit/560a4a30ea6821dcf82b4b2cba716ca5031b2ef1))
* **server:** set runningSince to timestamp ([#160](https://github.com/aeternity/state-channel-demo/issues/160)) ([fda8032](https://github.com/aeternity/state-channel-demo/commit/fda80324fbfeeef40758ed6328fce1b815f1196c))
* use a 2 minute timeout idle ([#142](https://github.com/aeternity/state-channel-demo/issues/142)) ([1edfc95](https://github.com/aeternity/state-channel-demo/commit/1edfc955c460999398edc921b3f3869b82272d42))
* use node api to check if channel is open before reconnection ([759da65](https://github.com/aeternity/state-channel-demo/commit/759da658ce2432b6ddb31f73744acd25adcb060c))


### CI / CD

* **build:** add argument to server Dockerfile ([3815176](https://github.com/aeternity/state-channel-demo/commit/3815176cebe1a1e8478e8f9c30f2f1d0f9f659a3))
* revert tls change as we use wildcard already ([#197](https://github.com/aeternity/state-channel-demo/issues/197)) ([d4e50c4](https://github.com/aeternity/state-channel-demo/commit/d4e50c4b314c64d0b92e37c81ea2ff9516b959e1))

## [1.0.3](https://github.com/aeternity/state-channel-demo/compare/v1.0.2...v1.0.3) (2022-10-03)


### Features

* **server:** console.log fatal error along with logger ([dd450c7](https://github.com/aeternity/state-channel-demo/commit/dd450c7ce70ff2b552c10d3c9dc1da58710c4246))


### Bug Fixes

* handle channel timeout ([c101135](https://github.com/aeternity/state-channel-demo/commit/c10113533c177f47f20775e1fce0342bf24e776c))


### Miscellaneous

* maintain node logs ([c7e4e3a](https://github.com/aeternity/state-channel-demo/commit/c7e4e3a7e0b478f72d6251b392620dcea62099e2))


### Refactorings

* **server:** console.log error before using logger ([560a4a3](https://github.com/aeternity/state-channel-demo/commit/560a4a30ea6821dcf82b4b2cba716ca5031b2ef1))

## [1.0.2](https://github.com/aeternity/state-channel-demo/compare/v1.0.1...v1.0.2) (2022-09-30)


### Features

* re-implement mobile ([647a7bf](https://github.com/aeternity/state-channel-demo/commit/647a7bf56af33fd359dfb2cf1a788272bba4cebb))


### Bug Fixes

* **main:** update release tag ([e933465](https://github.com/aeternity/state-channel-demo/commit/e9334656edc477b267ee74ffb77de3089c7d536b))

## [1.0.1](https://github.com/aeternity/state-channel-demo/compare/v1.0.0...v1.0.1) (2022-09-28)


### Features

* add channelCreateTx fee ([#126](https://github.com/aeternity/state-channel-demo/issues/126)) ([a3ffa12](https://github.com/aeternity/state-channel-demo/commit/a3ffa12434f98ddf95c5575eadfd548c6ef1ebe0))
* add debug status endpoint ([0f3a42b](https://github.com/aeternity/state-channel-demo/commit/0f3a42b6fca889f51ffa883e29f6f365cc8f1218))
* handle running out of coins ([#164](https://github.com/aeternity/state-channel-demo/issues/164)) ([f281165](https://github.com/aeternity/state-channel-demo/commit/f2811659f29dc4a427ccb077bb9610c9c5e68c75))
* optimize performance ([#143](https://github.com/aeternity/state-channel-demo/issues/143)) ([69c15de](https://github.com/aeternity/state-channel-demo/commit/69c15de9885d0315e580079207e3fca211c20913))
* release 1.0.1 ([eeef526](https://github.com/aeternity/state-channel-demo/commit/eeef526a07be297bc40bc88e8b6a795b124365bf))
* release follow package.json version tag ([b40b0e3](https://github.com/aeternity/state-channel-demo/commit/b40b0e3a9cc0d65aaffa82fca42f0ad00815e792))
* seperate nodes per env config ([cdd0f63](https://github.com/aeternity/state-channel-demo/commit/cdd0f63c30a73317d5eba64ad0aa9fe4000429d6))
* specify release tag in workflow ([8a81d65](https://github.com/aeternity/state-channel-demo/commit/8a81d6550d5f0ad8ccb310ee26899f61a78e188d))
* update twitter sharing text ([5f18d01](https://github.com/aeternity/state-channel-demo/commit/5f18d013972d008de96e2400239d7ea6da0581b9))


### Bug Fixes

* handle tx log unable to be sent ([46723cf](https://github.com/aeternity/state-channel-demo/commit/46723cf3d26193760ced69d80dc84de72367faa6))
* use ws instead of wss with deployed node ([#125](https://github.com/aeternity/state-channel-demo/issues/125)) ([35ff52f](https://github.com/aeternity/state-channel-demo/commit/35ff52f6271226d521eb9ab81ca850ae2f9d7e38))


### CI / CD

* **build:** add argument to server Dockerfile ([3815176](https://github.com/aeternity/state-channel-demo/commit/3815176cebe1a1e8478e8f9c30f2f1d0f9f659a3))


### Refactorings

* **client:** remove channel proxy ([dace82d](https://github.com/aeternity/state-channel-demo/commit/dace82d1c8baa3a7430d6e2e91d0b7ec1c595b5d))
* decode contract events instead of decoding w compiler ([#124](https://github.com/aeternity/state-channel-demo/issues/124)) ([a66c862](https://github.com/aeternity/state-channel-demo/commit/a66c862daeff7d80c7e64130010956445d363979))
* drop usage of HTTP compiler ([#163](https://github.com/aeternity/state-channel-demo/issues/163)) ([7bec539](https://github.com/aeternity/state-channel-demo/commit/7bec5396b243bdeaaeb79cac5c3dd6aea75fdffd))
* save results via transferFunds instead of sending an extra tx ([#147](https://github.com/aeternity/state-channel-demo/issues/147)) ([d069ce9](https://github.com/aeternity/state-channel-demo/commit/d069ce9a79c09a880de0681bb7242ccfadb7289b))
* use a 2 minute timeout idle ([#142](https://github.com/aeternity/state-channel-demo/issues/142)) ([1edfc95](https://github.com/aeternity/state-channel-demo/commit/1edfc955c460999398edc921b3f3869b82272d42))
* use node api to check if channel is open before reconnection ([759da65](https://github.com/aeternity/state-channel-demo/commit/759da658ce2432b6ddb31f73744acd25adcb060c))

## 1.0.0 (2022-09-09)


### Features

* add .5 second delay on faucet retry ([f036414](https://github.com/aeternity/state-channel-demo/commit/f0364145112b4ed9507d386b85fc3b461ac31100))
* add .gitattributes for persistent line endings ([333a121](https://github.com/aeternity/state-channel-demo/commit/333a121c5dd4192c48cc690b261952bf388657d3))
* add contract project ([9c80848](https://github.com/aeternity/state-channel-demo/commit/9c808485616a8215d52045a20079df92195672fe))
* add favicon ([1a65121](https://github.com/aeternity/state-channel-demo/commit/1a65121fc6a72ba4b109f8fefcd4e4d788305e79))
* add front skeleton code ([929647b](https://github.com/aeternity/state-channel-demo/commit/929647b9f91c8677c13806e8cb1c0c030def6f66))
* add gh actions pipelines ([185d931](https://github.com/aeternity/state-channel-demo/commit/185d931773fdbb81042fc83326604b3a58ea6689))
* add link to users aenalytics page ([d612f98](https://github.com/aeternity/state-channel-demo/commit/d612f98f8939207edd7380aa667ccbe247ccc0b4))
* add loader ([cfab740](https://github.com/aeternity/state-channel-demo/commit/cfab740227d44ae3cbd343755e703a7682aceeae))
* add more delay to funding retry ([c2be08d](https://github.com/aeternity/state-channel-demo/commit/c2be08d4ea7501a9e34f74984f374f52b60bbf46))
* add option to fund through faucet ([a2e4b21](https://github.com/aeternity/state-channel-demo/commit/a2e4b21c880476526d8c802440529a6947a83fc6))
* add pino as server logger ([071b1ff](https://github.com/aeternity/state-channel-demo/commit/071b1ff70d32c795f41fe5ebd5b147f0e3b3d997))
* add rock-paper-scissor buttons ([d051e38](https://github.com/aeternity/state-channel-demo/commit/d051e38da8c180bc83d0d404ba004ee8abceb866))
* add sdk docker config ([d5236eb](https://github.com/aeternity/state-channel-demo/commit/d5236eb4114d32bf00bcc4f07eb787fbaea9ccdf))
* add shadow to landing page ([df61fc9](https://github.com/aeternity/state-channel-demo/commit/df61fc9d3fe1a3cfb7db9e164846c12b4c05ce54))
* add timeout idle ([3d18067](https://github.com/aeternity/state-channel-demo/commit/3d180677e0bf8f1c38de697fbc615fa2a4584594))
* bot should send its balance back to the faucet on channel termination ([feb1ff3](https://github.com/aeternity/state-channel-demo/commit/feb1ff3bbbbda5276dc61e6312aa42c8da8068a2))
* change wording for signed transaction ([5bf87a3](https://github.com/aeternity/state-channel-demo/commit/5bf87a365f749e0a50448295af998f4b864e4fa5))
* clicking logo on end-screen resets app ([9748050](https://github.com/aeternity/state-channel-demo/commit/974805095ab8e72b5ecb3ce13edd2541408c0744))
* client should retry with a new account if given is greylisted ([#54](https://github.com/aeternity/state-channel-demo/issues/54)) ([0a35a51](https://github.com/aeternity/state-channel-demo/commit/0a35a51989a7732eb5f80165cee126e9032896e2))
* **client:** display contract locked in amount ([0c9adc6](https://github.com/aeternity/state-channel-demo/commit/0c9adc6cc92f4fd0e760659b3841614eb733c1ae))
* compare proposed bytecode ([e936ecd](https://github.com/aeternity/state-channel-demo/commit/e936ecdaa3287c7e7af6e5787ea3b94b58ca3c55))
* configure eslint and prettier ([781740e](https://github.com/aeternity/state-channel-demo/commit/781740eb73e9d181df1dcabb19a41f58aa6f33a9))
* contract service ([c5423ce](https://github.com/aeternity/state-channel-demo/commit/c5423ce8e936e78eaa34d6860aae9d9c71026ae8))
* create route for channel initialization ([f49ac3e](https://github.com/aeternity/state-channel-demo/commit/f49ac3ef57dbdf10e934347d3199a2939b9bde6e))
* create user selection transaction ([61ebdf9](https://github.com/aeternity/state-channel-demo/commit/61ebdf9322a638456e71401d657d922e14c83059))
* display balances ([d99e017](https://github.com/aeternity/state-channel-demo/commit/d99e017506f1c6b9fad0ea9ae090bb1815d2a54c))
* display open state channel and contract deployment tx ([41f6185](https://github.com/aeternity/state-channel-demo/commit/41f6185ea832c41c319a0b74f28a4e2805d9b3f2))
* display user and bot selection tx logs ([806d90c](https://github.com/aeternity/state-channel-demo/commit/806d90c9ca25da9861215a8fe518752c89f25efc))
* export contract as string an typescript declarations ([441b62b](https://github.com/aeternity/state-channel-demo/commit/441b62b99b43cd4bc4f95ad272763b2a9cb72f01))
* finish a game round ([#70](https://github.com/aeternity/state-channel-demo/issues/70)) ([780ff69](https://github.com/aeternity/state-channel-demo/commit/780ff69c9cc900f5c1cc1dffbfd6819de05228c2))
* group transaction logs ([cc4e812](https://github.com/aeternity/state-channel-demo/commit/cc4e8125177235eaa98f7451d5694681ed222748))
* ignore all node_module folders ([96f391d](https://github.com/aeternity/state-channel-demo/commit/96f391daa1a9372cbd78fab62630844a81882cd4))
* implement autoplay ([166b4d4](https://github.com/aeternity/state-channel-demo/commit/166b4d43d7ea65418e116e82603ceaa491a46339))
* implement game landing page ([8255335](https://github.com/aeternity/state-channel-demo/commit/82553352530574b6d246a29018691f99cd94e51f))
* implement Open State Channel button ([2d6cfd0](https://github.com/aeternity/state-channel-demo/commit/2d6cfd05933eda84491468510c1dc8de757e9afd))
* implement sharing results feature ([13fb65c](https://github.com/aeternity/state-channel-demo/commit/13fb65c223f129a2d72f7687a17837d3f2103d6a))
* initialize channel connection and connect to ws ([2255295](https://github.com/aeternity/state-channel-demo/commit/2255295afe120050f414385fe2d3fc72780e4052))
* only save the last 5 rounds when reconnecting ([998c500](https://github.com/aeternity/state-channel-demo/commit/998c500860578c4b01d83b5a3fbb392150f4a6f9))
* open state channel connection on button click ([535bfc1](https://github.com/aeternity/state-channel-demo/commit/535bfc1207648f0c7110beab3a1ea736090e5c0c))
* play another round ([71bd795](https://github.com/aeternity/state-channel-demo/commit/71bd795c328a85a6f8da55478d19d7dfd85ea193))
* **popup:** add tooltip ([fa68416](https://github.com/aeternity/state-channel-demo/commit/fa684167cc833a2ca6981b99fd2970a881f62655))
* process end-game tx and show ending screen ([e2bfc12](https://github.com/aeternity/state-channel-demo/commit/e2bfc12b3c512089e6886f530d8c3f034c7ab172))
* replace text with icons ([01caed2](https://github.com/aeternity/state-channel-demo/commit/01caed2312eadb8ee29fee1724a817e5f2527a71))
* retry funding when faucet throws an error diff than 425 ([2203491](https://github.com/aeternity/state-channel-demo/commit/22034917b860d25662b5f77fe6cd78dcba5032fc))
* Run all apps through docker ([5db9cc4](https://github.com/aeternity/state-channel-demo/commit/5db9cc4300f739ccd0d0d744210f920590a4a646))
* Run all apps through docker ([081b557](https://github.com/aeternity/state-channel-demo/commit/081b5573b6a488beda7cd4aeacb5108906547a66))
* save state to localstorage ([2c8211d](https://github.com/aeternity/state-channel-demo/commit/2c8211d4bbaf217664a95b326592e6bcf16a5bb0))
* **server:testnet:** handle multiple genesis funds ([5ce3c3b](https://github.com/aeternity/state-channel-demo/commit/5ce3c3b1cdbb14a9fc752e7a7c6ba823ded84705))
* **server:** add cors options for prd ([4ff0cce](https://github.com/aeternity/state-channel-demo/commit/4ff0cceba107c14f04172e70f0b62eaa9181ba5b))
* **server:** add cors origin options ([39a0bde](https://github.com/aeternity/state-channel-demo/commit/39a0bde3526e4674208705cb2193b8abced4315f))
* **server:** check whether if a greylisted account has enough coins ([d59eb58](https://github.com/aeternity/state-channel-demo/commit/d59eb5824c25817dd1777d5b93a3b56d34166432))
* **server:** complete a rock-paper-scissors game ([d9079ac](https://github.com/aeternity/state-channel-demo/commit/d9079ac2d06f249ce6cc83c6380cd43dd1c1f60c))
* **server:** deploy contract ([05c89a0](https://github.com/aeternity/state-channel-demo/commit/05c89a0161726e62348567fd47bdc5cdfea75ebf))
* **server:** return text on get request ([27d28f8](https://github.com/aeternity/state-channel-demo/commit/27d28f819eef40d1ea0a891a1a1a0c19cb3b64f9))
* **server:** use lockPeriod:0 for channelSettle ([9ca2150](https://github.com/aeternity/state-channel-demo/commit/9ca21504ee5f85ad9d9fdc3a10cee4f171a082c9))
* setup husky to run commitlint, linter and tests ([fe7a5b2](https://github.com/aeternity/state-channel-demo/commit/fe7a5b282413198f61f0f1d2fa2eb7923ba00e3e))
* setup vitest testing library ([bb12e72](https://github.com/aeternity/state-channel-demo/commit/bb12e72d6cfc50f9b60bd77d67b31e9d99d0075c))
* show account-funding status message ([5b50693](https://github.com/aeternity/state-channel-demo/commit/5b50693daa270fc375fcb68d64e429774a61ac27))
* split game screen in two ([7916a3a](https://github.com/aeternity/state-channel-demo/commit/7916a3a7155f9319beebd9d2785d10c598f3975d))
* update autoplay results ([20726d1](https://github.com/aeternity/state-channel-demo/commit/20726d14ca9238de2e1272462da32debb91de253))
* update terminal design ([0abc9a1](https://github.com/aeternity/state-channel-demo/commit/0abc9a1184544457d0f539ed3210707a1a7e0139))
* use different docker stages ([63a5046](https://github.com/aeternity/state-channel-demo/commit/63a50464a8245ff575d5a6dfcce3b120426e0098))
* use rock papers scissors contract ([dc49f6d](https://github.com/aeternity/state-channel-demo/commit/dc49f6dfbd8a929e99a0c545be9ed57669728612))
* user returns his remaining coins to the faucet ([4b9a588](https://github.com/aeternity/state-channel-demo/commit/4b9a588be8a85d2f327f1fc18fbc51e0c1fe4a35))


### Bug Fixes

* **ci:** remove extra slash form VITE_BOT_SERVICE_URL ([190b855](https://github.com/aeternity/state-channel-demo/commit/190b8556c9cb0e3e005785a5f52d32b9e8b8dd55))
* **ci:** set the correct VITE_BOT_SERVICE_URL ([ec482b5](https://github.com/aeternity/state-channel-demo/commit/ec482b52f2bca6f29a0585060f24f1608684e45d))
* **ci:** use builder stage for local dev ([915d113](https://github.com/aeternity/state-channel-demo/commit/915d1138a12c5faf9b3c95f2e0690bf4f9e4580c))
* **ci:** use the correct backend url on stg env ([75fcc7e](https://github.com/aeternity/state-channel-demo/commit/75fcc7e6706c7d35b417537f321736eb146132a9))
* clear local storage on channel close ([66431ba](https://github.com/aeternity/state-channel-demo/commit/66431ba11f0b8efcb886a5e73c4eef0b4a3a0655))
* **client:** remove reconnecting prefix showing on reload ([d7e45b2](https://github.com/aeternity/state-channel-demo/commit/d7e45b2f5c951caf3c1b53977b993094d3e7766a))
* **client:** replace commonjs import post build ([14d185e](https://github.com/aeternity/state-channel-demo/commit/14d185e53d484c0f657a1c9dfa05bb87614afb02))
* **client:** sdk not re-initializing new keypair ([ed96b5f](https://github.com/aeternity/state-channel-demo/commit/ed96b5f4b61388b4ed88f7305cb292c8b82e60cc))
* **client:** wait for contract to be deployed before enabling picks ([3032107](https://github.com/aeternity/state-channel-demo/commit/3032107f2be6f9c49cd9a1b46992af2b599f5284))
* eol issue ([e1c1a4f](https://github.com/aeternity/state-channel-demo/commit/e1c1a4f18da492898fa27c86504626d4ebb83137))
* fix server hangup and error message showing when retrying ([67ad152](https://github.com/aeternity/state-channel-demo/commit/67ad152714fb31162fa2b157a346e72672d5458c))
* hack for devmode crash at rollback ([2caffc7](https://github.com/aeternity/state-channel-demo/commit/2caffc73774237d8a1b652e8a49ee76889cb2cc3))
* hot reload issue ([900240e](https://github.com/aeternity/state-channel-demo/commit/900240eb0990dda7dc51096221ee52063f084800))
* **husky:** make scripts executable ([06ff6a9](https://github.com/aeternity/state-channel-demo/commit/06ff6a9e9aa3a0d0b9397afb746ccc0e580c57bd))
* inform user of channel died and reset ([6251caf](https://github.com/aeternity/state-channel-demo/commit/6251caf29d33006b43e4b1c39e2a774ad36c90b9))
* responsiveness issues ([2e63208](https://github.com/aeternity/state-channel-demo/commit/2e63208650cd8650e9b2e655bab209fdaeac7fcc))
* **server:** do not retry only if player is greylisted ([81717f8](https://github.com/aeternity/state-channel-demo/commit/81717f85001b0e3a69536720531590b6b65c7801))
* **server:** handle cases where maxRetries is undefiend ([bcafc3a](https://github.com/aeternity/state-channel-demo/commit/bcafc3a1ecf0bf10b20eb803aa189de2ee2e6605))
* **server:** test promise not resolving ([dfa99e8](https://github.com/aeternity/state-channel-demo/commit/dfa99e87eac433a8eedf27567458c775a19c1e8a))
* speed up uat env using minimumDepth options ([ab84f83](https://github.com/aeternity/state-channel-demo/commit/ab84f838bd695b3c28b97a542b7ea1c993effd36))
* wait for contract to be ready before allowing user to make selection ([39b1b96](https://github.com/aeternity/state-channel-demo/commit/39b1b96c9cbdccf2fea5fa228a7b8a44741354d8))


### Testing

* **bot-service:** unit test core functions ([2ad6895](https://github.com/aeternity/state-channel-demo/commit/2ad6895d3ebf93592cdb91452b5aa66f17d60e3f))
* **controller:** open channel controller ([5395c77](https://github.com/aeternity/state-channel-demo/commit/5395c77e8010eba644cb8b5e45c5ac515abd7bbf))
* **server:** unit test contract methods without channel dep ([7c51fc5](https://github.com/aeternity/state-channel-demo/commit/7c51fc5024550cf83ad96283da0a84b2df8c1ae0))
* **server:** use waitForChannelReady util function ([c8e90d3](https://github.com/aeternity/state-channel-demo/commit/c8e90d3a345053caf10c4aef9c3f3d825d9728cd))
* state persistence ([6802d18](https://github.com/aeternity/state-channel-demo/commit/6802d181707c511a7d7b02f78cfffed5d78d3569))
* state resets and disputes ([909b979](https://github.com/aeternity/state-channel-demo/commit/909b9795f2da9b31f4bf7aab3141c6137df45f62))


### CI / CD

* **build:** add contract folder in the build process ([b6fc2b1](https://github.com/aeternity/state-channel-demo/commit/b6fc2b144be4f675030d9a3a41ecd4c1beb57d59))
* **build:** fix develop backend build ([c7095ea](https://github.com/aeternity/state-channel-demo/commit/c7095ea6ca238f2108a6aded222898727cef158b))
* **build:** update path to package json file ([3eb37a8](https://github.com/aeternity/state-channel-demo/commit/3eb37a863d4fcc750c78335d48bef409abeeede7))
* **build:** update path to package json file for backend ([9ea23a0](https://github.com/aeternity/state-channel-demo/commit/9ea23a08c02fe58b59727344cff8cccb1e96899f))
* **build:** update release please plugin ([83a0820](https://github.com/aeternity/state-channel-demo/commit/83a0820cefb3a982e6924e327c77fa3197f4c7f4))
* run server before tests ([#59](https://github.com/aeternity/state-channel-demo/issues/59)) ([f9562d4](https://github.com/aeternity/state-channel-demo/commit/f9562d473b11dcf95b9ba6b25d9948e9ca06edfc))


### Refactorings

* **client:** remove sdk proxy ([2f441ab](https://github.com/aeternity/state-channel-demo/commit/2f441abdb03ff8d1f68a9e5d663e214ed45ebb0f))
* **client:** use channel in store ([69c04c4](https://github.com/aeternity/state-channel-demo/commit/69c04c4cce96c8eb31ea50c1a872d76690044434))
* load fonts locally ([1ef494e](https://github.com/aeternity/state-channel-demo/commit/1ef494eba718f51d6fc29ba4b495b90a5557499b))
* move channel instance to App component ([d31f244](https://github.com/aeternity/state-channel-demo/commit/d31f244e0e49e521ab38bdbafcbce9a3dd02d4d6))
* remove popup ([2f530dc](https://github.com/aeternity/state-channel-demo/commit/2f530dc4bbf6626bbdeafb4e96a8b8c8b7cb539f))
* rename controller to route ([f5b88e4](https://github.com/aeternity/state-channel-demo/commit/f5b88e4006faf8ff37d17087d89f0f7f7d6bdffc))
* rename core folders to server client ([c122e59](https://github.com/aeternity/state-channel-demo/commit/c122e5956d698fedfdca788189ad34485cf30231))
* run server & client without docker-compose ([#53](https://github.com/aeternity/state-channel-demo/issues/53)) ([1b1efe6](https://github.com/aeternity/state-channel-demo/commit/1b1efe67f5edb37144193549cd6d15c77839c3cf))
* **server:** have a gamesession state for each game' ([8ced8b1](https://github.com/aeternity/state-channel-demo/commit/8ced8b1c5cc1ebf350086cab096ca7df74bb23ff))
* **server:** move sdk related services from bot to sdk service ([b78be79](https://github.com/aeternity/state-channel-demo/commit/b78be792ccd5c7b4708150ed0860c48f62fed9dd))
* **server:** update configuration ([4b9a981](https://github.com/aeternity/state-channel-demo/commit/4b9a981863a380056d0978c72e752cb40e4aae93))
* simplify bot-service ([5434141](https://github.com/aeternity/state-channel-demo/commit/5434141946269c95a1dc2ff856409b5c7debd031))
* use new node url ([3603716](https://github.com/aeternity/state-channel-demo/commit/3603716fb344f0b2e5d5655b3d21073d6d835729))
* use new node url in .env.testnet ([5691bc7](https://github.com/aeternity/state-channel-demo/commit/5691bc707b2fddcdf5d9331bd74d350dad523dba))


### Miscellaneous

* add .dockerignore ([03d466b](https://github.com/aeternity/state-channel-demo/commit/03d466b70da4b939c7616af054856fbd1474cfa2))
* add env config for testnet ([e017754](https://github.com/aeternity/state-channel-demo/commit/e0177545bc2415bfd6196777275fcceb2fb8caf1))
* add responder port and host in config ([5306190](https://github.com/aeternity/state-channel-demo/commit/53061903f59a66d2356ac6ff07d39dd361a2d6b2))
* **client:** deactive test parallelization ([aba7a9a](https://github.com/aeternity/state-channel-demo/commit/aba7a9a574bb8a5c57bc1f48f4f29c97d9a83bd5))
* **client:** update @aeternity/aepp-sdk to 12.1.1 ([0bc5662](https://github.com/aeternity/state-channel-demo/commit/0bc5662d2832c0c4c7213cc182d6236e2a3dd79e))
* **develop:** release 1.0.0 ([#113](https://github.com/aeternity/state-channel-demo/issues/113)) ([0b0c59b](https://github.com/aeternity/state-channel-demo/commit/0b0c59be19d3c4449dfdc93a1702b4ed19d8bf7e))
* pass env vars through .env file ([4e68cda](https://github.com/aeternity/state-channel-demo/commit/4e68cda110f1d367e207b9911201bf1d935a4695))
* revert devmode changes and introduce gh-action for contract tests if needed ([3bb4cd9](https://github.com/aeternity/state-channel-demo/commit/3bb4cd90f1ca794238876ed18f5761a76fc8d6e2))
* **server:** add custom message on funding error ([b623199](https://github.com/aeternity/state-channel-demo/commit/b6231997c94d0994e71bb9b9a71f035edb674746))
* **server:** pump @aeternity/aepp-sdk to 12.1.1 ([65b4b67](https://github.com/aeternity/state-channel-demo/commit/65b4b67e1c7a3f428e5f4e096972f5cd546afbe4))
* **server:** replace deprecated function sha256hash ([6fc8f3f](https://github.com/aeternity/state-channel-demo/commit/6fc8f3fd5cfab52b63345394d527246b1b108e3a))
* update bot-service structure ([62e3403](https://github.com/aeternity/state-channel-demo/commit/62e3403066c1bb0ce013a50926d2a41f9c75ff81))
* update packagelocks ([c6c6a32](https://github.com/aeternity/state-channel-demo/commit/c6c6a32d6d535c27e296845b046700b80850bc65))

## 1.0.0 (2022-09-09)


### Features

* add .5 second delay on faucet retry ([f036414](https://github.com/aeternity/state-channel-demo/commit/f0364145112b4ed9507d386b85fc3b461ac31100))
* add .gitattributes for persistent line endings ([333a121](https://github.com/aeternity/state-channel-demo/commit/333a121c5dd4192c48cc690b261952bf388657d3))
* add contract project ([9c80848](https://github.com/aeternity/state-channel-demo/commit/9c808485616a8215d52045a20079df92195672fe))
* add favicon ([1a65121](https://github.com/aeternity/state-channel-demo/commit/1a65121fc6a72ba4b109f8fefcd4e4d788305e79))
* add front skeleton code ([929647b](https://github.com/aeternity/state-channel-demo/commit/929647b9f91c8677c13806e8cb1c0c030def6f66))
* add gh actions pipelines ([185d931](https://github.com/aeternity/state-channel-demo/commit/185d931773fdbb81042fc83326604b3a58ea6689))
* add link to users aenalytics page ([d612f98](https://github.com/aeternity/state-channel-demo/commit/d612f98f8939207edd7380aa667ccbe247ccc0b4))
* add loader ([cfab740](https://github.com/aeternity/state-channel-demo/commit/cfab740227d44ae3cbd343755e703a7682aceeae))
* add more delay to funding retry ([c2be08d](https://github.com/aeternity/state-channel-demo/commit/c2be08d4ea7501a9e34f74984f374f52b60bbf46))
* add option to fund through faucet ([a2e4b21](https://github.com/aeternity/state-channel-demo/commit/a2e4b21c880476526d8c802440529a6947a83fc6))
* add pino as server logger ([071b1ff](https://github.com/aeternity/state-channel-demo/commit/071b1ff70d32c795f41fe5ebd5b147f0e3b3d997))
* add rock-paper-scissor buttons ([d051e38](https://github.com/aeternity/state-channel-demo/commit/d051e38da8c180bc83d0d404ba004ee8abceb866))
* add sdk docker config ([d5236eb](https://github.com/aeternity/state-channel-demo/commit/d5236eb4114d32bf00bcc4f07eb787fbaea9ccdf))
* add shadow to landing page ([df61fc9](https://github.com/aeternity/state-channel-demo/commit/df61fc9d3fe1a3cfb7db9e164846c12b4c05ce54))
* add timeout idle ([3d18067](https://github.com/aeternity/state-channel-demo/commit/3d180677e0bf8f1c38de697fbc615fa2a4584594))
* bot should send its balance back to the faucet on channel termination ([feb1ff3](https://github.com/aeternity/state-channel-demo/commit/feb1ff3bbbbda5276dc61e6312aa42c8da8068a2))
* change wording for signed transaction ([5bf87a3](https://github.com/aeternity/state-channel-demo/commit/5bf87a365f749e0a50448295af998f4b864e4fa5))
* clicking logo on end-screen resets app ([9748050](https://github.com/aeternity/state-channel-demo/commit/974805095ab8e72b5ecb3ce13edd2541408c0744))
* client should retry with a new account if given is greylisted ([#54](https://github.com/aeternity/state-channel-demo/issues/54)) ([0a35a51](https://github.com/aeternity/state-channel-demo/commit/0a35a51989a7732eb5f80165cee126e9032896e2))
* **client:** display contract locked in amount ([0c9adc6](https://github.com/aeternity/state-channel-demo/commit/0c9adc6cc92f4fd0e760659b3841614eb733c1ae))
* compare proposed bytecode ([e936ecd](https://github.com/aeternity/state-channel-demo/commit/e936ecdaa3287c7e7af6e5787ea3b94b58ca3c55))
* configure eslint and prettier ([781740e](https://github.com/aeternity/state-channel-demo/commit/781740eb73e9d181df1dcabb19a41f58aa6f33a9))
* contract service ([c5423ce](https://github.com/aeternity/state-channel-demo/commit/c5423ce8e936e78eaa34d6860aae9d9c71026ae8))
* create route for channel initialization ([f49ac3e](https://github.com/aeternity/state-channel-demo/commit/f49ac3ef57dbdf10e934347d3199a2939b9bde6e))
* create user selection transaction ([61ebdf9](https://github.com/aeternity/state-channel-demo/commit/61ebdf9322a638456e71401d657d922e14c83059))
* display balances ([d99e017](https://github.com/aeternity/state-channel-demo/commit/d99e017506f1c6b9fad0ea9ae090bb1815d2a54c))
* display open state channel and contract deployment tx ([41f6185](https://github.com/aeternity/state-channel-demo/commit/41f6185ea832c41c319a0b74f28a4e2805d9b3f2))
* display user and bot selection tx logs ([806d90c](https://github.com/aeternity/state-channel-demo/commit/806d90c9ca25da9861215a8fe518752c89f25efc))
* export contract as string an typescript declarations ([441b62b](https://github.com/aeternity/state-channel-demo/commit/441b62b99b43cd4bc4f95ad272763b2a9cb72f01))
* finish a game round ([#70](https://github.com/aeternity/state-channel-demo/issues/70)) ([780ff69](https://github.com/aeternity/state-channel-demo/commit/780ff69c9cc900f5c1cc1dffbfd6819de05228c2))
* group transaction logs ([cc4e812](https://github.com/aeternity/state-channel-demo/commit/cc4e8125177235eaa98f7451d5694681ed222748))
* ignore all node_module folders ([96f391d](https://github.com/aeternity/state-channel-demo/commit/96f391daa1a9372cbd78fab62630844a81882cd4))
* implement autoplay ([166b4d4](https://github.com/aeternity/state-channel-demo/commit/166b4d43d7ea65418e116e82603ceaa491a46339))
* implement game landing page ([8255335](https://github.com/aeternity/state-channel-demo/commit/82553352530574b6d246a29018691f99cd94e51f))
* implement Open State Channel button ([2d6cfd0](https://github.com/aeternity/state-channel-demo/commit/2d6cfd05933eda84491468510c1dc8de757e9afd))
* implement sharing results feature ([13fb65c](https://github.com/aeternity/state-channel-demo/commit/13fb65c223f129a2d72f7687a17837d3f2103d6a))
* initialize channel connection and connect to ws ([2255295](https://github.com/aeternity/state-channel-demo/commit/2255295afe120050f414385fe2d3fc72780e4052))
* only save the last 5 rounds when reconnecting ([998c500](https://github.com/aeternity/state-channel-demo/commit/998c500860578c4b01d83b5a3fbb392150f4a6f9))
* open state channel connection on button click ([535bfc1](https://github.com/aeternity/state-channel-demo/commit/535bfc1207648f0c7110beab3a1ea736090e5c0c))
* play another round ([71bd795](https://github.com/aeternity/state-channel-demo/commit/71bd795c328a85a6f8da55478d19d7dfd85ea193))
* **popup:** add tooltip ([fa68416](https://github.com/aeternity/state-channel-demo/commit/fa684167cc833a2ca6981b99fd2970a881f62655))
* process end-game tx and show ending screen ([e2bfc12](https://github.com/aeternity/state-channel-demo/commit/e2bfc12b3c512089e6886f530d8c3f034c7ab172))
* replace text with icons ([01caed2](https://github.com/aeternity/state-channel-demo/commit/01caed2312eadb8ee29fee1724a817e5f2527a71))
* retry funding when faucet throws an error diff than 425 ([2203491](https://github.com/aeternity/state-channel-demo/commit/22034917b860d25662b5f77fe6cd78dcba5032fc))
* Run all apps through docker ([5db9cc4](https://github.com/aeternity/state-channel-demo/commit/5db9cc4300f739ccd0d0d744210f920590a4a646))
* Run all apps through docker ([081b557](https://github.com/aeternity/state-channel-demo/commit/081b5573b6a488beda7cd4aeacb5108906547a66))
* save state to localstorage ([2c8211d](https://github.com/aeternity/state-channel-demo/commit/2c8211d4bbaf217664a95b326592e6bcf16a5bb0))
* **server:testnet:** handle multiple genesis funds ([5ce3c3b](https://github.com/aeternity/state-channel-demo/commit/5ce3c3b1cdbb14a9fc752e7a7c6ba823ded84705))
* **server:** add cors options for prd ([4ff0cce](https://github.com/aeternity/state-channel-demo/commit/4ff0cceba107c14f04172e70f0b62eaa9181ba5b))
* **server:** add cors origin options ([39a0bde](https://github.com/aeternity/state-channel-demo/commit/39a0bde3526e4674208705cb2193b8abced4315f))
* **server:** check whether if a greylisted account has enough coins ([d59eb58](https://github.com/aeternity/state-channel-demo/commit/d59eb5824c25817dd1777d5b93a3b56d34166432))
* **server:** complete a rock-paper-scissors game ([d9079ac](https://github.com/aeternity/state-channel-demo/commit/d9079ac2d06f249ce6cc83c6380cd43dd1c1f60c))
* **server:** deploy contract ([05c89a0](https://github.com/aeternity/state-channel-demo/commit/05c89a0161726e62348567fd47bdc5cdfea75ebf))
* **server:** return text on get request ([27d28f8](https://github.com/aeternity/state-channel-demo/commit/27d28f819eef40d1ea0a891a1a1a0c19cb3b64f9))
* **server:** use lockPeriod:0 for channelSettle ([9ca2150](https://github.com/aeternity/state-channel-demo/commit/9ca21504ee5f85ad9d9fdc3a10cee4f171a082c9))
* setup husky to run commitlint, linter and tests ([fe7a5b2](https://github.com/aeternity/state-channel-demo/commit/fe7a5b282413198f61f0f1d2fa2eb7923ba00e3e))
* setup vitest testing library ([bb12e72](https://github.com/aeternity/state-channel-demo/commit/bb12e72d6cfc50f9b60bd77d67b31e9d99d0075c))
* show account-funding status message ([5b50693](https://github.com/aeternity/state-channel-demo/commit/5b50693daa270fc375fcb68d64e429774a61ac27))
* split game screen in two ([7916a3a](https://github.com/aeternity/state-channel-demo/commit/7916a3a7155f9319beebd9d2785d10c598f3975d))
* update autoplay results ([20726d1](https://github.com/aeternity/state-channel-demo/commit/20726d14ca9238de2e1272462da32debb91de253))
* update terminal design ([0abc9a1](https://github.com/aeternity/state-channel-demo/commit/0abc9a1184544457d0f539ed3210707a1a7e0139))
* use different docker stages ([63a5046](https://github.com/aeternity/state-channel-demo/commit/63a50464a8245ff575d5a6dfcce3b120426e0098))
* use rock papers scissors contract ([dc49f6d](https://github.com/aeternity/state-channel-demo/commit/dc49f6dfbd8a929e99a0c545be9ed57669728612))
* user returns his remaining coins to the faucet ([4b9a588](https://github.com/aeternity/state-channel-demo/commit/4b9a588be8a85d2f327f1fc18fbc51e0c1fe4a35))


### Bug Fixes

* **ci:** remove extra slash form VITE_BOT_SERVICE_URL ([190b855](https://github.com/aeternity/state-channel-demo/commit/190b8556c9cb0e3e005785a5f52d32b9e8b8dd55))
* **ci:** set the correct VITE_BOT_SERVICE_URL ([ec482b5](https://github.com/aeternity/state-channel-demo/commit/ec482b52f2bca6f29a0585060f24f1608684e45d))
* **ci:** use builder stage for local dev ([915d113](https://github.com/aeternity/state-channel-demo/commit/915d1138a12c5faf9b3c95f2e0690bf4f9e4580c))
* **ci:** use the correct backend url on stg env ([75fcc7e](https://github.com/aeternity/state-channel-demo/commit/75fcc7e6706c7d35b417537f321736eb146132a9))
* clear local storage on channel close ([66431ba](https://github.com/aeternity/state-channel-demo/commit/66431ba11f0b8efcb886a5e73c4eef0b4a3a0655))
* **client:** remove reconnecting prefix showing on reload ([d7e45b2](https://github.com/aeternity/state-channel-demo/commit/d7e45b2f5c951caf3c1b53977b993094d3e7766a))
* **client:** replace commonjs import post build ([14d185e](https://github.com/aeternity/state-channel-demo/commit/14d185e53d484c0f657a1c9dfa05bb87614afb02))
* **client:** sdk not re-initializing new keypair ([ed96b5f](https://github.com/aeternity/state-channel-demo/commit/ed96b5f4b61388b4ed88f7305cb292c8b82e60cc))
* **client:** wait for contract to be deployed before enabling picks ([3032107](https://github.com/aeternity/state-channel-demo/commit/3032107f2be6f9c49cd9a1b46992af2b599f5284))
* eol issue ([e1c1a4f](https://github.com/aeternity/state-channel-demo/commit/e1c1a4f18da492898fa27c86504626d4ebb83137))
* fix server hangup and error message showing when retrying ([67ad152](https://github.com/aeternity/state-channel-demo/commit/67ad152714fb31162fa2b157a346e72672d5458c))
* hack for devmode crash at rollback ([2caffc7](https://github.com/aeternity/state-channel-demo/commit/2caffc73774237d8a1b652e8a49ee76889cb2cc3))
* hot reload issue ([900240e](https://github.com/aeternity/state-channel-demo/commit/900240eb0990dda7dc51096221ee52063f084800))
* **husky:** make scripts executable ([06ff6a9](https://github.com/aeternity/state-channel-demo/commit/06ff6a9e9aa3a0d0b9397afb746ccc0e580c57bd))
* inform user of channel died and reset ([6251caf](https://github.com/aeternity/state-channel-demo/commit/6251caf29d33006b43e4b1c39e2a774ad36c90b9))
* responsiveness issues ([2e63208](https://github.com/aeternity/state-channel-demo/commit/2e63208650cd8650e9b2e655bab209fdaeac7fcc))
* **server:** do not retry only if player is greylisted ([81717f8](https://github.com/aeternity/state-channel-demo/commit/81717f85001b0e3a69536720531590b6b65c7801))
* **server:** handle cases where maxRetries is undefiend ([bcafc3a](https://github.com/aeternity/state-channel-demo/commit/bcafc3a1ecf0bf10b20eb803aa189de2ee2e6605))
* **server:** test promise not resolving ([dfa99e8](https://github.com/aeternity/state-channel-demo/commit/dfa99e87eac433a8eedf27567458c775a19c1e8a))
* speed up uat env using minimumDepth options ([ab84f83](https://github.com/aeternity/state-channel-demo/commit/ab84f838bd695b3c28b97a542b7ea1c993effd36))
* wait for contract to be ready before allowing user to make selection ([39b1b96](https://github.com/aeternity/state-channel-demo/commit/39b1b96c9cbdccf2fea5fa228a7b8a44741354d8))


### Testing

* **bot-service:** unit test core functions ([2ad6895](https://github.com/aeternity/state-channel-demo/commit/2ad6895d3ebf93592cdb91452b5aa66f17d60e3f))
* **controller:** open channel controller ([5395c77](https://github.com/aeternity/state-channel-demo/commit/5395c77e8010eba644cb8b5e45c5ac515abd7bbf))
* **server:** unit test contract methods without channel dep ([7c51fc5](https://github.com/aeternity/state-channel-demo/commit/7c51fc5024550cf83ad96283da0a84b2df8c1ae0))
* **server:** use waitForChannelReady util function ([c8e90d3](https://github.com/aeternity/state-channel-demo/commit/c8e90d3a345053caf10c4aef9c3f3d825d9728cd))
* state persistence ([6802d18](https://github.com/aeternity/state-channel-demo/commit/6802d181707c511a7d7b02f78cfffed5d78d3569))
* state resets and disputes ([909b979](https://github.com/aeternity/state-channel-demo/commit/909b9795f2da9b31f4bf7aab3141c6137df45f62))


### Miscellaneous

* add .dockerignore ([03d466b](https://github.com/aeternity/state-channel-demo/commit/03d466b70da4b939c7616af054856fbd1474cfa2))
* add env config for testnet ([e017754](https://github.com/aeternity/state-channel-demo/commit/e0177545bc2415bfd6196777275fcceb2fb8caf1))
* add responder port and host in config ([5306190](https://github.com/aeternity/state-channel-demo/commit/53061903f59a66d2356ac6ff07d39dd361a2d6b2))
* **client:** deactive test parallelization ([aba7a9a](https://github.com/aeternity/state-channel-demo/commit/aba7a9a574bb8a5c57bc1f48f4f29c97d9a83bd5))
* **client:** update @aeternity/aepp-sdk to 12.1.1 ([0bc5662](https://github.com/aeternity/state-channel-demo/commit/0bc5662d2832c0c4c7213cc182d6236e2a3dd79e))
* pass env vars through .env file ([4e68cda](https://github.com/aeternity/state-channel-demo/commit/4e68cda110f1d367e207b9911201bf1d935a4695))
* revert devmode changes and introduce gh-action for contract tests if needed ([3bb4cd9](https://github.com/aeternity/state-channel-demo/commit/3bb4cd90f1ca794238876ed18f5761a76fc8d6e2))
* **server:** add custom message on funding error ([b623199](https://github.com/aeternity/state-channel-demo/commit/b6231997c94d0994e71bb9b9a71f035edb674746))
* **server:** pump @aeternity/aepp-sdk to 12.1.1 ([65b4b67](https://github.com/aeternity/state-channel-demo/commit/65b4b67e1c7a3f428e5f4e096972f5cd546afbe4))
* **server:** replace deprecated function sha256hash ([6fc8f3f](https://github.com/aeternity/state-channel-demo/commit/6fc8f3fd5cfab52b63345394d527246b1b108e3a))
* update bot-service structure ([62e3403](https://github.com/aeternity/state-channel-demo/commit/62e3403066c1bb0ce013a50926d2a41f9c75ff81))
* update packagelocks ([c6c6a32](https://github.com/aeternity/state-channel-demo/commit/c6c6a32d6d535c27e296845b046700b80850bc65))


### CI / CD

* **build:** add contract folder in the build process ([b6fc2b1](https://github.com/aeternity/state-channel-demo/commit/b6fc2b144be4f675030d9a3a41ecd4c1beb57d59))
* **build:** fix develop backend build ([c7095ea](https://github.com/aeternity/state-channel-demo/commit/c7095ea6ca238f2108a6aded222898727cef158b))
* **build:** update path to package json file ([3eb37a8](https://github.com/aeternity/state-channel-demo/commit/3eb37a863d4fcc750c78335d48bef409abeeede7))
* **build:** update path to package json file for backend ([9ea23a0](https://github.com/aeternity/state-channel-demo/commit/9ea23a08c02fe58b59727344cff8cccb1e96899f))
* **build:** update release please plugin ([83a0820](https://github.com/aeternity/state-channel-demo/commit/83a0820cefb3a982e6924e327c77fa3197f4c7f4))
* run server before tests ([#59](https://github.com/aeternity/state-channel-demo/issues/59)) ([f9562d4](https://github.com/aeternity/state-channel-demo/commit/f9562d473b11dcf95b9ba6b25d9948e9ca06edfc))


### Refactorings

* **client:** remove sdk proxy ([2f441ab](https://github.com/aeternity/state-channel-demo/commit/2f441abdb03ff8d1f68a9e5d663e214ed45ebb0f))
* **client:** use channel in store ([69c04c4](https://github.com/aeternity/state-channel-demo/commit/69c04c4cce96c8eb31ea50c1a872d76690044434))
* load fonts locally ([1ef494e](https://github.com/aeternity/state-channel-demo/commit/1ef494eba718f51d6fc29ba4b495b90a5557499b))
* move channel instance to App component ([d31f244](https://github.com/aeternity/state-channel-demo/commit/d31f244e0e49e521ab38bdbafcbce9a3dd02d4d6))
* remove popup ([2f530dc](https://github.com/aeternity/state-channel-demo/commit/2f530dc4bbf6626bbdeafb4e96a8b8c8b7cb539f))
* rename controller to route ([f5b88e4](https://github.com/aeternity/state-channel-demo/commit/f5b88e4006faf8ff37d17087d89f0f7f7d6bdffc))
* rename core folders to server client ([c122e59](https://github.com/aeternity/state-channel-demo/commit/c122e5956d698fedfdca788189ad34485cf30231))
* run server & client without docker-compose ([#53](https://github.com/aeternity/state-channel-demo/issues/53)) ([1b1efe6](https://github.com/aeternity/state-channel-demo/commit/1b1efe67f5edb37144193549cd6d15c77839c3cf))
* **server:** have a gamesession state for each game' ([8ced8b1](https://github.com/aeternity/state-channel-demo/commit/8ced8b1c5cc1ebf350086cab096ca7df74bb23ff))
* **server:** move sdk related services from bot to sdk service ([b78be79](https://github.com/aeternity/state-channel-demo/commit/b78be792ccd5c7b4708150ed0860c48f62fed9dd))
* **server:** update configuration ([4b9a981](https://github.com/aeternity/state-channel-demo/commit/4b9a981863a380056d0978c72e752cb40e4aae93))
* simplify bot-service ([5434141](https://github.com/aeternity/state-channel-demo/commit/5434141946269c95a1dc2ff856409b5c7debd031))
* use new node url ([3603716](https://github.com/aeternity/state-channel-demo/commit/3603716fb344f0b2e5d5655b3d21073d6d835729))
* use new node url in .env.testnet ([5691bc7](https://github.com/aeternity/state-channel-demo/commit/5691bc707b2fddcdf5d9331bd74d350dad523dba))
