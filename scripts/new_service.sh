#!/bin/bash

set -e

# Helper script to create a new service

## Helper function to create menus ##
function choose_from_menu() {
    local -r prompt="$1" outvar="$2" options=("${@:3}")
    local cur=0 count=${#options[@]} index=0
    local esc=$(echo -en "\e") # cache ESC as test doesn't allow esc codes
    printf "$prompt\n"
    while true
    do
        # list all options (option list is zero-based)
        index=0 
        for o in "${options[@]}"
        do
            if [ "$index" == "$cur" ]
            then echo -e " >\e[7m$o\e[0m" # mark & highlight the current option
            else echo "  $o"
            fi
            (( ++index ))
        done
        read -s -n3 key # wait for user to key in arrows or ENTER
        if [[ $key == $esc[A ]] # up arrow
        then (( cur-- )); (( cur < 0 )) && (( cur = 0 ))
        elif [[ $key == $esc[B ]] # down arrow
        then (( ++cur )); (( cur >= count )) && (( cur = count - 1 ))
        elif [[ $key == "" ]] # nothing, i.e the read delimiter - ENTER
        then break
        fi
        echo -en "\e[${count}A" # go up to the beginning to re-render
    done
    # export the selection to the requested output variable
    printf -v $outvar "${options[$cur]}"
}

## Main script ##

service_types=(
    "admin"
    "application"
    "shared"
)

choose_from_menu "Select a service type:" service_type "${service_types[@]}"
echo "You selected: $service_type"

read -p "Enter the new service name: " service_name
echo "You entered: $service_name"

cd src/$service_type
mkdir -p "$service_name"
cd "$service_name"

npm init -y

sed -i "s/\"name\": \"ui\"/\"name\": \"@tme\/$service_type-$service_name\"/" package.json
sed -i 's|"test": "echo \\"Error: no test specified\\" && exit 1"|"build": "tsc",\n    "start": "node dist/index.js",\n    "dev": "ts-node src/index.ts"|' package.json

npm i --save-dev typescript ts-node @types/node
mkdir -p src