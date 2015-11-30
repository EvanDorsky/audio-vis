#!/bin/bash
#
# Got this from https://www.exratione.com/2014/09/nodejs-is-too-inefficient-to-monitor-files-so-use-bash-scripts-instead/
# Thanks Evan Simpson!
#
#
# Place this script into your project and run it to monitor specific project
# directories and all their subdirectory contents for file updates.
#
# To make this useful, you will have to:
#
# 1) Adjust the PROJECT_DIR variable as appropriate depending on
#     where this script is located in the project.
#
# 2) Add directories to the MONITOR array.
#
# 3) Add the set of actions to be taken when a change happens, such
#     as running a task, restarting a server process, and so forth.
#
# Note that this script blocks and runs until killed, so you may want to
# launch it as a background task.
#
 
# The absolute path of the directory containing this script.
DIR="$( cd "$( dirname "$0" )" && pwd)"
# Where is the top level project directory relative to this script?
PROJECT_DIR="${DIR}"
 
# Set up a list of directories to monitor.
MONITOR=()
MONITOR+=( "${PROJECT_DIR}" )
MONITOR+=( "${PROJECT_DIR}/stylus" )
MONITOR+=( "${PROJECT_DIR}/jade" )
 
# This file will be used as a timestamp reference point.
TIMESTAMP_FILE="/tmp/file-monitor-ts"
 
# The interval in seconds between each check on monitored files.
INTERVAL_SECONDS=1
# How long in the past to to set the timestamp on the reference file
# used for comparison. This is probably overkill, but when running
# Vagrant VMs with synced folders you can run into all sorts of
# interesting behavior with regard to updating timestamps.
LOOKBACK_SECONDS=2
 
# The last set of updates. We keep this for comparison purposes.
# Since the lookback covers multiple cycles of monitoring for changes
# we need to be able to update only if there are fresh changes in
# the present cycle.
LAST_UPDATES=""
 
# Loop indefinitely. Killing this process is the only way to exit it, 
# which is fine, but you may want to add some sort of check on other
# criteria so that it can shut itself down in response to circumstances.
while [[ true ]] ; do
  # OS X has a date command signature that differs significantly from
  # that used in Linux distros.
  if [[ ${OSTYPE} =~ ^darwin ]]; then
    TIMESTAMP=`date +%s`
    TIMESTAMP=$(( ${TIMESTAMP} - ${LOOKBACK_SECONDS} ))
    TIMESTAMP=`date -r ${TIMESTAMP} +%m%d%H%M.%S`
  else
    TIMESTAMP=`date -d "-${LOOKBACK_SECONDS} sec" +%m%d%H%M.%S`
  fi
 
  # Create or update the reference timestamp file.
  touch -t ${TIMESTAMP} "${TIMESTAMP_FILE}"
 
  # Identify updates by comparison with the reference timestamp file.
  UPDATES=`find ${MONITOR[*]} -type f -newer ${TIMESTAMP_FILE}`
 
  if [[ "${UPDATES}" ]] ; then
    # Pass the updates through ls or stat in order to add a timestamp for
    # each result. Thus if the same file is updated several times over several
    # monitor cycles it will still trigger when compared to the prior set of
    # updates.
    if [[ ${OSTYPE} =~ ^darwin ]]; then
      UPDATES=`stat -F ${UPDATES}`
    else
      UPDATES=`ls --full-time ${UPDATES}`
    fi
 
    # Only take action if there are new changes in this monitor cycle.
    if [[ "${UPDATES}" != "${LAST_UPDATES}" ]] ; then
 
         make all
 
    fi
  fi
 
  LAST_UPDATES="${UPDATES}"
  sleep ${INTERVAL_SECONDS}
done