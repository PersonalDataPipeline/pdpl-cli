
## Usage
<!-- usage -->
```sh-session
$ npm install -g pdpl-cli
$ pdpl COMMAND
running command...
$ pdpl (--version)
pdpl-cli/0.12.0 darwin-arm64 node-v20.11.1
$ pdpl --help [COMMAND]
USAGE
  $ pdpl COMMAND
...
```
<!-- usagestop -->

## Commands
<!-- commands -->
* [`pdpl api:authorize APINAME`](#pdpl-apiauthorize-apiname)
* [`pdpl api:curl APINAME`](#pdpl-apicurl-apiname)
* [`pdpl api:get APINAME`](#pdpl-apiget-apiname)
* [`pdpl api:info APINAME`](#pdpl-apiinfo-apiname)
* [`pdpl api:list`](#pdpl-apilist)
* [`pdpl api:logs APINAME`](#pdpl-apilogs-apiname)
* [`pdpl api:queue:get APINAME`](#pdpl-apiqueueget-apiname)
* [`pdpl api:queue:set APINAME`](#pdpl-apiqueueset-apiname)
* [`pdpl config:get`](#pdpl-configget)
* [`pdpl config:init`](#pdpl-configinit)
* [`pdpl import IMPORTNAME IMPORTPATH`](#pdpl-import-importname-importpath)
* [`pdpl recipe:run RECIPE_NAME`](#pdpl-reciperun-recipe_name)
* [`pdpl recipe:validate RECIPE_NAME`](#pdpl-recipevalidate-recipe_name)

## `pdpl api:authorize APINAME`

Authorize for an API

```
USAGE
  $ pdpl api:authorize APINAME [--stop-at <value>]

FLAGS
  --stop-at=<value>  Stop at a certain stage of the authorization process

EXAMPLES
  $ pdpl api:authorize API_NAME

FLAG DESCRIPTIONS
  --stop-at=<value>  Stop at a certain stage of the authorization process

    Accepts "authorize" or "callback" or "exchange"
```

## `pdpl api:curl APINAME`

Build cURL commands for all API endpoints

```
USAGE
  $ pdpl api:curl APINAME

EXAMPLES
  $ pdpl api:curl API_NAME
```

## `pdpl api:get APINAME`

Get API data based on a queue

```
USAGE
  $ pdpl api:get APINAME [--force]

FLAGS
  --force  Force API calls to run even if delay has not passed

EXAMPLES
  $ pdpl api:get API_NAME
```

## `pdpl api:info APINAME`

Display info for a specific API

```
USAGE
  $ pdpl api:info APINAME

EXAMPLES
  $ pdpl api:info API_NAME
```

## `pdpl api:list`

List all APIs available

```
USAGE
  $ pdpl api:list

EXAMPLES
  $ pdpl api:list
```

## `pdpl api:logs APINAME`

List log entries for an API

```
USAGE
  $ pdpl api:logs APINAME [-n <value>] [--errors-only]

FLAGS
  -n, --number=<value>  [default: 25] Number of logs to print
      --errors-only     Only show logs with errors

EXAMPLES
  $ pdpl api:logs API_NAME

  $ pdpl api:logs API_NAME --errors-only

  $ pdpl api:logs API_NAME -n 50

FLAG DESCRIPTIONS
  -n, --number=<value>  Number of logs to print

    Indicates the number of log files to process and count. Log file are sorted descending by date, starting with the
    most recent.

  --errors-only  Only show logs with errors

    Pulls the number of logs, then filters out all logs that do not have an error.
```

## `pdpl api:queue:get APINAME`

Show the queue for an API

```
USAGE
  $ pdpl api:queue:get APINAME

EXAMPLES
  $ pdpl api:queue:get API_NAME
```

## `pdpl api:queue:set APINAME`

Initialize the queue for an API

```
USAGE
  $ pdpl api:queue:set APINAME [-s | -h] [--run-now] [-e <value>]

FLAGS
  -e, --endpoint=<value>  Only initialize a specific endpoint
  -h, --historic-only     Only initialize historic entries
  -s, --standard-only     Only initialize standard entries
      --run-now           Set the run after time to now

EXAMPLES
  $ pdpl api:queue:set API_NAME

  $ pdpl api:queue:set API_NAME --standard-only

  $ pdpl api:queue:set API_NAME --historic-only

  $ pdpl api:queue:set API_NAME --endpoint --run-now
```

## `pdpl config:get`

Get configuration

```
USAGE
  $ pdpl config:get [--json]

FLAGS
  --json

EXAMPLES
  $ pdpl config:get
```

## `pdpl config:init`

Initialize configuration file

```
USAGE
  $ pdpl config:init

EXAMPLES
  $ pdpl config:init
```

## `pdpl import IMPORTNAME IMPORTPATH`

Import a file or directory

```
USAGE
  $ pdpl import IMPORTNAME IMPORTPATH

EXAMPLES
  $ pdpl import IMPORT_NAME
```

## `pdpl recipe:run RECIPE_NAME`

Process data using recipes

```
USAGE
  $ pdpl recipe:run RECIPE_NAME
```

## `pdpl recipe:validate RECIPE_NAME`

Process data using recipes

```
USAGE
  $ pdpl recipe:validate RECIPE_NAME
```
<!-- commandsstop -->
