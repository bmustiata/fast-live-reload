#!/bin/bash

echo "Failing service STARTED"

echo "Failing service second 1"
sleep 1
echo "Failing service second 2" >&2
sleep 1
echo "Failing service second 3"
sleep 1

echo "Failing service STOP"

exit 1