
## Usage
<!-- usage -->
```sh-session
$ npm install -g pdpl-get
$ pdpl-get COMMAND
running command...
$ pdpl-get (--version)
pdpl-get/0.8.8 darwin-arm64 node-v20.11.1
$ pdpl-get --help [COMMAND]
USAGE
  $ pdpl-get COMMAND
...
```
<!-- usagestop -->

## Commands
<!-- commands -->
* [`pdpl-get api:authorize APINAME`](#pdpl-get-apiauthorize-apiname)
* [`pdpl-get api:curl APINAME`](#pdpl-get-apicurl-apiname)
* [`pdpl-get api:get APINAME`](#pdpl-get-apiget-apiname)
* [`pdpl-get api:info APINAME`](#pdpl-get-apiinfo-apiname)
* [`pdpl-get api:list`](#pdpl-get-apilist)
* [`pdpl-get api:logs APINAME`](#pdpl-get-apilogs-apiname)
* [`pdpl-get api:queue:get APINAME`](#pdpl-get-apiqueueget-apiname)
* [`pdpl-get api:queue:set APINAME`](#pdpl-get-apiqueueset-apiname)
* [`pdpl-get config:get`](#pdpl-get-configget)
* [`pdpl-get config:init`](#pdpl-get-configinit)
* [`pdpl-get import IMPORTNAME IMPORTPATH`](#pdpl-get-import-importname-importpath)

## `pdpl-get api:authorize APINAME`

Authorize for an API

```
USAGE
  $ pdpl-get api:authorize APINAME

EXAMPLES
  $ pdpl-get api:authorize API_NAME
```

## `pdpl-get api:curl APINAME`

Build cURL commands for all API endpoints

```
USAGE
  $ pdpl-get api:curl APINAME

EXAMPLES
  $ pdpl-get api:curl API_NAME
```

## `pdpl-get api:get APINAME`

Get API data based on a queue

```
USAGE
  $ pdpl-get api:get APINAME [--force]

FLAGS
  --force  Force API calls to run even if delay has not passed

EXAMPLES
  $ pdpl-get api:get API_NAME
```

## `pdpl-get api:info APINAME`

Display info for a specific API

```
USAGE
  $ pdpl-get api:info APINAME

EXAMPLES
  $ pdpl-get api:info API_NAME
```

## `pdpl-get api:list`

List all APIs available

```
USAGE
  $ pdpl-get api:list

EXAMPLES
  $ pdpl-get api:list
```

## `pdpl-get api:logs APINAME`

List log entries for an API

```
USAGE
  $ pdpl-get api:logs APINAME [-n <value>] [--errors-only]

FLAGS
  -n, --number=<value>  [default: 25] Number of logs to print
      --errors-only     Only show logs with errors

EXAMPLES
  $ pdpl-get api:logs API_NAME

  $ pdpl-get api:logs API_NAME --errors-only

  $ pdpl-get api:logs API_NAME -n 50

FLAG DESCRIPTIONS
  -n, --number=<value>  Number of logs to print

    Indicates the number of log files to process and count. Log file are sorted descending by date, starting with the
    most recent.

  --errors-only  Only show logs with errors

    Pulls the number of logs, then filters out all logs that do not have an error.
```

## `pdpl-get api:queue:get APINAME`

Show the queue for an API

```
USAGE
  $ pdpl-get api:queue:get APINAME

EXAMPLES
  $ pdpl-get api:queue:get API_NAME
```

## `pdpl-get api:queue:set APINAME`

Initialize the queue for an API

```
USAGE
  $ pdpl-get api:queue:set APINAME [-s | -h] [--run-now] [-e <value>]

FLAGS
  -e, --endpoint=<value>  Only initialize a specific endpoint
  -h, --historic-only     Only initialize historic entries
  -s, --standard-only     Only initialize standard entries
      --run-now           Set the run after time to now

EXAMPLES
  $ pdpl-get api:queue:set API_NAME

  $ pdpl-get api:queue:set API_NAME --standard-only

  $ pdpl-get api:queue:set API_NAME --historic-only

  $ pdpl-get api:queue:set API_NAME --endpoint --run-now
```

## `pdpl-get config:get`

Get configuration

```
USAGE
  $ pdpl-get config:get [--json]

FLAGS
  --json

EXAMPLES
  $ pdpl-get config:get
```

## `pdpl-get config:init`

Initialize configuration file

```
USAGE
  $ pdpl-get config:init

EXAMPLES
  $ pdpl-get config:init
```

## `pdpl-get import IMPORTNAME IMPORTPATH`

Import a file or directory

```
USAGE
  $ pdpl-get import IMPORTNAME IMPORTPATH

EXAMPLES
  $ pdpl-get import IMPORT_NAME
```
<!-- commandsstop -->
