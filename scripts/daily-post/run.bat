@echo off
REM NWT Progress — Daily Auto-Post (Windows wrapper)
REM Called by Windows Task Scheduler. Runs the bash script via WSL.
wsl.exe -e bash /home/alexi/projects/nwt-progress/scripts/daily-post/run.sh >> /tmp/nwt-daily-post.log 2>&1
