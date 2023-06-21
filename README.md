# Introduction

This software is designed to fetch printouts from the ALMA API and print them on locally defined printers.

It does not require a user to be logged into the host computer.

This software is based on [Alma-print-daemon](https://github.com/ExLibrisGroup/alma-print-daemon) by [ExLibrisGroup](https://github.com/ExLibrisGroup)

# Requirements

- A computer or server running Windows (10/11/server2016/server2019/server2022)
- A recent LTS version of nodejs (18 or higher)
- Network access to ALMA API (direct or via proxy)
- One or more locally defined printers (direct or network printers)

# Installation

Installation can be done in multiple ways depending on the network access of the host computer

## Variant 1

### Requirements

- Git for Windows installed on the host
- NPM (Node Package Manager) installed in the host (comes as part of nodejs install)
- Network access to Git repository (GitHub)
- Network access to NPM repository (https://registry.npmjs.org)

### Step by Step

open CMD or Powershell and navigate to the place of installation

```git clone``` this project

```cd alma-print-nogui```

```npm install```

## Variant 2

If the host computer does not have the required network access Variant 1 can be done on another computer and the resulting folder can be copied to the host.

## Variant 3

If Git for Windows is not an option you can download the code as a .zip from GitHub

# Setup

Setup consists of 4 steps

## Step 1

Edit the config file, see also config/config.sample for inspiration

- ```"apiPath" : "https://api-**.hosted.exlibrisgroup.com/almaws/v1"``` replace ```**``` with your region (eu,na...)
- ```"apiKey":"*********************"``` replace ```***``` with an ALMA API key with read access to /config and read&write access to /tasklist
- ```"proxy":"http://proxy.contoso.com:8080"``` OPTIONAL, if set requires protocol(http://) FQDN(proxy.someurl.com) and port (:8080)
- ```"logTimestampFormat":"YYYY-MM-DDTHH:mm:ss"``` how timestamps should be formated (see winstonjs timestamp format for details)
- ```"maxLogAgeInDays":30``` how long should logs be kept
- ```"logConfig":[]``` Array containing log destinations
   * ```"level":"info"``` defines what messages should be logged, in this case "info" and above ("warn" & "error") (see winstonjs log levels for details)
   * ```"type":"console"``` defines console as output (CMD or Powershell etc.)
   * ```"format":"text"``` defines how messages should be formated, "text" is default, "json" is another option
   * ```"type":"file"``` defines a file as output, requires "folder", "extension" and "destination" or "rotate" options to be set aswell
   * ```"rotate":true``` RECOMMENDED: sets the filename as the current date so it rotates automatically, if this is set "destination" is not required
   * ```"destination":"test"``` sets the filename as "test", this option may lead to issues
   * ```"folder":"log"``` sets the folder for logfiles as "log/"
   * ```"extension":".txt"``` sets the file extension as ".txt"
- ```"pdfRetention":true``` defines if the generated PDF's should be kept or deleted immediatly
- ```"maxPDFAgeInDays":30``` how long should PDF's be kept
- ```"almaPrinterProfiles":[]``` Array containing printer configurations
   * ```"almaPrinter":"************"``` id of an alma Printer with printouts queue, to get these id's run ```node test-api.js``` NOTE: to use ```node test-api.js``` there should be a config with "apiPath" and "apiKey"
   * ```"localPrinter":"**************"``` name of a local Printer, to get these run ```node test-local.js```. NOTE: these strings have a different format than with the original ALMA Print Daemon
   * ```"orientation":"portrait"``` or "landscape"
   * ```"color":"true"``` or "false"
   * ```"letterFormat":"A4"``` or other format supported by your printer
   * ```"marginTop":"50"``` margin in pixels
   * ```"marginBottom":"50"``` margin in pixels
   * ```"marginLeft":"50"``` margin in pixels
   * ```"marginRight":"50"``` margin in pixels
   * ```"copies":1``` number of copies that should be printed

## Step 2

Test the config by running ```node test-api.js``` and ```node test-local.js```
```node test-api.js``` should output a list of ALMA printers that the API key has access to
```node test-local.js``` should output a list of locally defined printers

now test the script by running ```node print.js```

## Step 3

Setup Windows Task Scheduler to run ```print.js``` regularly

- Hit the Windows key an type ```Task Scheduler``` and hit ```Enter```
- Navigate to ```Task Scheduler Library``` in the left pane
- Click ```Create Task...``` in the right pane
- In the Tab ```General``` Fill out ```Name``` and ```Description``` and check ````Run wether user is logged on or not```
   * If you choose to use a different user make sure that that user has access to the install location on the disk and that the user has the printers installed (printers are not always installed for all users)
- In the Tab ```Triggers``` click on ```New...```
   * in the ```Begin the Task:``` dropdown select ```On a schedule```
   * Select ```Daily``` or ```Weekly``` (```Weekly``` allows to not run the script on certain days of the week)
   * Define a ```Start:``` date and time (06:00:00 for example)
   * If you selected ```Weekly``` select which days of the week you want the script to run
   * check ```Repeat task every:``` and select the interval you want it to run (5 minutes for example, you can also change the value for something that is not in the dropdown by using the keyboard)
   * set ```for a duration of``` (16 hours for example)
   * check ```Stop task if it runs longer than:``` and set it to a reasonable value (1 hour for example)
   * check ```Enabled```
- In the Tab ```Actions``` click on ```New...```
   * Define ```Action:``` as ```Start a program```
   * Define ```Program/script``` as the install path of nodejs (usually ```C:\Program Files\nodejs\node.exe```)
   * Define ```Add arguments``` as the location of ```print.js``` (```C:\alma-print-nogui\print.js``` for example)
   * Define ```Start in``` as the location of the script (```C:\alma-print-nogui\``` for example)
- In the Tab ```Conditions```
   * Uncheck ```Start the task only if the computer is idle for```
   * Uncheck ```Start the task only if the computer is on AC power```
   * OPTIONAL: check ```Wake the computer to run this task``` if the host is not a server running 24/7
   * OPTIONAL: check ```Start only if the following network connection is available``` and set to ```Any connection```
- In the Tab ```Settings```
   * check ```Allow task to be run on demand```
   * check ```Run task as soon as possible after a scheduled start is missed```
   * check ```If the task fails restart every``` and set to reasonable value (1 minute)
   * check ```Attempt to restart up to``` and set to reasonable value (60) (this will try to restart every minute for an hour)
   * check ```Stop task if it runs longer than:``` and set it to a reasonable value (1 hour for example)
   * check ```If the running tsak does net end when requested, force it to stop```
   * in ```If the task is already running, then the following rule applies``` set it to ```Do not start a new instance```
- If you press ```OK``` the defined users password will be asked, this will also happen everytime you change a setting.
- Right click on the newly created task a select ```Run```
- check the logs if the script ran successfully

## Step 4

repeat Step 3 for clean.js to run once a day or once a week to delete old logs/pdf's