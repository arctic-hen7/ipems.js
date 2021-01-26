#!/bin/bash

# Simply runs the `yarn run validate` command and summarises the output for less brain work!

[[ $1 -eq 0 ]] && echo -e "\n\e[1;92mPASSED" || echo -e "\n\e[1;91mFAILED"
