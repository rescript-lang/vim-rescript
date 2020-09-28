#!/usr/bin/bash

VIM_HOME="$HOME/.vim"
DIRS="vim/*"

for dir in $DIRS; do
	base=$(basename $dir)
	path=$VIM_HOME/$base

	# If some folder (e.g. ftdetect) has never been created ...
	if [ ! -d $path ]; then
		# ... copy the whole folder into appropriate path
		cp -r $dir $path
	else
		# or just copy the syntax files.
		cp $dir/* $path/
	fi	
done

