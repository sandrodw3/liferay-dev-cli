# liferay dev cli

**liferay dev cli** (`lfr`) is a command-line framework designed to streamline everyday tasks in a Liferay development environment. It allows developers to execute common actions like deploying modules or formatting a branch from anywhere within the project, without needing to switch modules or navigate to specific directories.
  
## 🎯 Motivation
In short, this project is designed to save time on those small daily tasks that usually take more steps than we'd like, such as deploying all modified modules in a pull request, starting the portal with the latest tomcat version, or running a Playwright test.

## ⚡️ Installation
Tutorial on how to install the tool.

## 💡 Usage
Just run `lfr [command]` with any desired options. All commands include a `-h` option to display help. You can also run just `lfr` to see the full CLI help.

By default, `lfr` uses a minimalist and compact output for its commands. Most of them have a `-d` option available to display the traditional output of each one.

## ⚙️ Commands

- [`ant-all`](#ant-all)
- [`build-lang`](#build-lang)
- [`config`](#config)
- [`deploy`](#deploy)
- [`find`](#find)
- [`format`](#format)
- [`node-scripts`](#node-scripts)
- [`jest`](#jest)
- [`playwright`](#playwright)
- [`poshi`](#poshi)
- [`start`](#start)
- [`stop`](#stop)
- [`upgrade`](#upgrade)


### `ant-all`

Run ant all in the current Liferay portal project.

```
lfr ant-all <options>
```

| Option                 | Description                                                                                |
| ---------------------- | ------------------------------------------------------------------------------------------ |
| `-c, --clean`          | Remove bundles folder (except properties files) and untracked files before running ant all |
| `-d, --default-output` | Log the default output                                                                     |
| `-p, --profile`        | Set the given profile (valid values are **dxp** and **portal**)                            |

### `build-lang`

Execute `buildLang` in `portal-language-lang` module.

```
lfr build-lang
```

### `config`

Allow setting user configuration, that is stored in `.lfr/config.json` file in user's folder. This configuration is needed for the app to work correclty. MySQL config is optional, it's only used to start the portal with a clean database.

```
lfr config [entry] [value] <options>
```

| Entry         | Description                                                                                        |
|---------------|----------------------------------------------------------------------------------------------------|
| `portal.path` | Liferay portal path                                                                                |
| `base.branch` | Base branch to be used for example to compare and get the modified modules of a branch             |
| `mysql.user`  | MySQL user                                                                                         |
| `mysql.pw`    | MySQL password                                                                                     |
| `mysql.db`    | Name of Liferay Portal MySQL database                                                              |

| Option         | Description                                               |
| -------------- | --------------------------------------------------------- |
| `-m, --modify` | Allow modifying current config values                     |
| `-s, --show`   | Show current configuration                                |

### `deploy`

Deploy a module or a bunch of them, depending on options.

```
lfr ant-all <options>
```

| Option                    | Description                                                                  |
| ------------------------- | ---------------------------------------------------------------------------- |
| `-a, --skip-dependencies` | Do not rebuild project dependencies (equivalent to `gradlew deploy -a`)      |
| `-b, --current-branch`    | Deploy all modules modified in current branch                                |
| `-c, --clean`             | Clean everything from previous builds (equivalent to `gradlew clean deploy`) |
| `-d, --default-output`    | Log the default gradle output                                                |
| `-m, --module`            | Allow selecting a specific module to deploy                                  |

### `find`

Allow finding a module and getting its path. Requires [fzf](https://github.com/junegunn/fzf) to be used. This command is useful to use the result for another thing. For example, you could do a bash script like `module=$(lfr find); code module`, and it would allow you to select a module and open it with VS Code.

```
lfr find
```

### `format`

Format a module or a branch, depending on options. If no passing options, format the current module.

```
lfr format <options>
```

| Option                 | Description                                                                                                      |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `-b, --current-branch` | Format the current branch (`ant format-source-current-branch` and `npx node-scripts check:tsc --current-branch`) |
| `-d, --default-output` | Log the default output                                                                                           |
| `-m, --module`         | Allow selecting a specific module to format (`gradlew formatSource`)                                             |

### `node-scripts`

Run `node-scripts` commands globally or in current module.

```
lfr node-scripts [command] <options>
```

| Option                 | Description                                                   |
| ---------------------- | ------------------------------------------------------------- |
| `-a, --all`            | Execute the command for everything                            |
| `-b, --current-branch` | Execute the command considering changes in the current branch |
| `-g, --global`         | Run the command globally                                      |
| `-l, --local-changes`  | Execute the command considering only uncommitted changes      |

### `jest`

Run Jest tests in a module or multiple modules.

```
lfr jest <options>
```

| Option                 | Description                                                                  |
| ---------------------- | ---------------------------------------------------------------------------- |
| `-b, --current-branch` | Run tests in all modules modified in current branch                          |
| `-d, --default-output` | Log the default output                                                       |
| `-m, --module`         | Allow selecting a specific module to run tests                               |

### `playwright`

Run Playwright tests in a file or module.

```
lfr playwright <options>
```

| Option         | Description                    |
| -------------- | ------------------------------ |
| `--ui`         | Run tests in UI mode           |
| `-m, --module` | Run tests in a specific module |

### `poshi`

Run the given Poshi test. The `[test]` argument should be specified as `File#TestName` (e.g., `PortalSmoke#Smoke`).

```
lfr poshi [test]
```

### `start`

Start portal with the latest Tomcat version. MySQL configuration needs to be set to be able to use `-c` option to start with a clean database.

```
lfr start <options>
```

| Option        | Description                    |
| ------------- | ------------------------------ |
| `-c, --clean` | Clean database before starting |

### `stop`

Stop the currently running portal instance.

```
lfr stop
```

### `upgrade`

Upgrade `lfr` to the latest version.

```
lfr upgrade
```
