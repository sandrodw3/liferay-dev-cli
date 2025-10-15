<div align="center">

<img width="150px" alt="Liferay Dev CLI logo" src="images/logo.png">

<a name="readme-top"></a>

# Liferay Dev CLI

**Liferay Dev CLI** (`lfr`) is a command-line framework designed to streamline everyday tasks in a Liferay development environment, enabling developers to execute common actions from anywhere within the project without the need to switch modules or navigate to specific directories. Tasks that usually require more steps than desired, such as deploying all modified modules in a branch, formatting it, starting the portal with the latest Tomcat version, running Playwright tests, and much more, will be now easily accessible. Available for **Linux** and **MacOS**.

[![deno_badge_url]][deno_url]
[![typescript_badge_url]][typescript_url]

</div>

## 🪄 Examples

![Example of running `lfr deploy -b`](images/deploy-b.png)

![Example of running `lfr deploy -m`](images/deploy-m.png)

![Example of running `lfr start -c`](images/start-c.png)

![Example of running `lfr ant-all -c`](images/ant-all-c.png)

## ⚡️ Installation

`lfr` is available for **Linux** and **MacOS**.

### Install prerequisites

- [`deno`][deno_installation_url] (**v2.2.8** or higher required)
- [`fzf`][fzf_installation_url]

### Install Liferay Dev CLI

```
curl -fsSL https://raw.githubusercontent.com/sandrodw3/liferay-dev-cli/main/install.sh | sh
```

## 💡 Usage
Just run `lfr [command]` with any desired options. All commands include a `-h` option to display help. You can also run just `lfr` to see the full CLI help.

By default, `lfr` uses a minimalist and compact output for its commands. Most of them have a `-d` option available to display the traditional output of each one.

There's also available an `lfr upgrade` command to update the CLI to its latest version and an `lfr config` one to set the necessary configuration for the CLI to work.

## ⚙️ Commands

Explanation and description of how each of the commands and their available options work.

- [`ant-all`](#ant-all)
- [`build-lang`](#build-lang)
- [`code`](#code)
- [`config`](#config)
- [`deploy`](#deploy)
- [`find`](#find)
- [`format`](#format)
- [`language-keys`](#language-keys)
- [`node-scripts`](#node-scripts)
- [`jest`](#jest)
- [`playwright`](#playwright)
- [`poshi`](#poshi)
- [`start`](#start)
- [`stop`](#stop)
- [`upgrade`](#upgrade)

### `ant-all`

Run ant all in the Liferay portal project. `-c` option can be passed to remove `bundles` folder (except properties files) before doing it. `bundles` folder path is taken from `app.server.parent.dir` variable of `app.server.[username].properties` file, or in the default `app.server.properties` if the first one is not present.

```
lfr ant-all [options...]
```

| Option                    | Description                                                                                |
| ------------------------- | ------------------------------------------------------------------------------------------ |
| `-c, --clean`             | Remove bundles folder (except properties files) and untracked files before running ant all |
| `-d, --default-output`    | Log the default output                                                                     |
| `-p, --profile <profile>` | Set the given profile (valid values are **dxp** and **portal**)                            |

---

### `build-lang`

Execute `buildLang` in `portal-language-lang` module.

```
lfr build-lang
```

---

### `build-service`

Execute `buildService` on a module or a bunch of them, depending on options. If no passing `-m` or `-b` options, run it on the current module.

```
lfr build-service [options...]
```

| Option                    | Description                                                                  |
| ------------------------- | ---------------------------------------------------------------------------- |
| `-b, --current-branch`    | Run `buildService` on all modules modified in current branch                 |
| `-d, --default-output`    | Log the default gradle output                                                |
| `-m, --module`            | Allow selecting a specific module to run `buildService`                      |

---

### `code`

Open the selected module with VS Code if it is installed.

```
lfr code [options...]
```

| Option                 | Description                                                   |
| ---------------------- | ------------------------------------------------------------- |
| `-n, --new-window`     | Open module in a new VS Code window                           |

---

### `config`

Allow setting user configuration, that is stored in `.lfr/config.json` file in user's folder. This configuration is needed for the app to work correctly. `entry` and `value` are mandatory if no option is specified.

```
lfr config [entry] [value] [options...]
```

| Entry         | Description                                                                                        |
|---------------|--------------------------------------------------------------------------------------------------- |
| `portal.path` | Liferay portal path                                                                                |
| `base.branch` | Base branch to be used for example to compare and get the modified modules of a branch             |


| Option         | Description                                               |
| -------------- | --------------------------------------------------------- |
| `-m, --modify` | Allow modifying current config values                     |
| `-s, --show`   | Show current configuration                                |

---

### `deploy`

Deploy a module or a bunch of them, depending on options. If no passing `-m` or `-b` options, deploy the current module.

```
lfr deploy [options...]
```

| Option                    | Description                                                                  |
| ------------------------- | ---------------------------------------------------------------------------- |
| `-a, --skip-dependencies` | Do not rebuild project dependencies (equivalent to `gradlew deploy -a`)      |
| `-b, --current-branch`    | Deploy all modules modified in current branch                                |
| `-c, --clean`             | Clean everything from previous builds (equivalent to `gradlew clean deploy`) |
| `-d, --default-output`    | Log the default gradle output                                                |
| `-m, --module`            | Allow selecting a specific module to deploy                                  |

---

### `find`

Allow finding a module and getting its path. Requires [fzf](https://github.com/junegunn/fzf) to be used. This command is useful to use the result for another thing. For example, you could do a bash script like `module=$(lfr find); cd module`, and it would allow you to select a module and then change to its directory.

```
lfr find
```

---

### `format`

Format a module or a branch, depending on options. If no passing options, format the current module with `gradlew formatSource`.

```
lfr format [options...]
```

| Option                 | Description                                                                                                      |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `-b, --current-branch` | Format the current branch (`ant format-source-current-branch`, `npx node-scripts check:tsc --current-branch` and `npx node-scripts check:ci --current-branch`)                                                                                                                          |
| `-d, --default-output` | Log the default output                                                                                           |
| `-m, --module`         | Allow selecting a specific module to format (`gradlew formatSource`)                                             |

---

### `language-keys`

Ask user to introduce phrases, generate language keys and then add them to `Language.properties` file. Phrases will be skipped if they already exist. `-b` can be passed to execute `buildLang` after adding keys. If passing `-c`, generated changes will be committed at the end. If there are existing commits for adding language keys or doing `buildLang`, these commits will be amended with the changes.

```
lfr language-keys [options...]
```

| Option                 | Description                                                                                                                    |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `-b, --build-lang`     | Execute `buildLang` after adding keys                                                                                          |
| `-c, --commit-changes` | Commit generated changes (one commit for the keys and another one for the `buildLang`). Use existing commits if they are found |     

---

### `node-scripts`

Run `node-scripts` commands globally or in current module.

```
lfr node-scripts <command> [options...]
```

| Option                 | Description                                                   |
| ---------------------- | ------------------------------------------------------------- |
| `-a, --all`            | Execute the command for everything                            |
| `-b, --current-branch` | Execute the command considering changes in the current branch |
| `-g, --global`         | Run the command globally                                      |
| `-l, --local-changes`  | Execute the command considering only uncommitted changes      |

---

### `jest`

Run Jest tests in a module or multiple modules.

```
lfr jest [options...]
```

| Option                 | Description                                                                  |
| ---------------------- | ---------------------------------------------------------------------------- |
| `-b, --current-branch` | Run tests in all modules modified in current branch                          |
| `-d, --default-output` | Log the default output                                                       |
| `-m, --module`         | Allow selecting a specific module to run tests                               |

---

### `playwright`

Run Playwright tests in a file or module.

```
lfr playwright [options...]
```

| Option         | Description                    |
| -------------- | ------------------------------ |
| `--ui`         | Run tests in UI mode           |
| `-m, --module` | Run tests in a specific module |

---

### `poshi`

Run the given Poshi test. The `<test>` argument should be specified as `File#TestName` (e.g., `PortalSmoke#Smoke`).

```
lfr poshi <test>
```

---

### `start`

Start portal with the latest Tomcat version. Database configuration is taken from `portal-ext.properties` file in `bundles` folder. `bundles` folder path is taken from `app.server.parent.dir` variable of `app.server.[username].properties` file, or in the default `app.server.properties` if the first one is not present.

```
lfr start [...options]
```

| Option        | Description                                                                                                                         |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `-c, --clean` | Clean database and data folders before starting (to clean database, the user needs to be using `MySQL` or `PostgreSQL` as database) |

---

### `stop`

Stop the currently running portal instance.

```
lfr stop
```

---

### `upgrade`

Upgrade `lfr` to its latest version.

```
lfr upgrade
```

<!-- Links -->

[deno_badge_url]: https://img.shields.io/badge/Deno-464647?style=for-the-badge&logo=deno&logoColor=white
[deno_installation_url]: https://github.com/denoland/deno/?tab=readme-ov-file#installation
[deno_url]: https://deno.com/

[fzf_installation_url]: https://github.com/junegunn/fzf?tab=readme-ov-file#installation

[typescript_badge_url]: https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white
[typescript_url]: https://www.typescriptlang.org/