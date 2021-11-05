#!/bin/bash

while [ "$1" != "" ]; do
    case $1 in
        -pp | --processparameters )   shift
                                pp=$1
                                ;;
    esac
    shift
done
echo $pp
cat values/calculatecapacity.json | jq ".[] + {Statement: $(cat $pp | jq '.WebAcl.RuleStatements.Statement')}" > temp_calculatecapacity.json