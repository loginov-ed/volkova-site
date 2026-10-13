#!/bin/zsh
# Публикация сайта на хостинг REG.RU (volkova-gyn.ru) по SSH-ключу ~/.ssh/volkova_hosting.
# Загружает только файлы сайта в www/volkova-gyn.ru, ничего не удаляет.
cd "$(dirname "$0")"
rsync -rtvz --checksum --exclude '.DS_Store' \
  -e "ssh -i $HOME/.ssh/volkova_hosting -o BatchMode=yes -o IdentitiesOnly=yes" \
  index.html styles.css main.js reviews.js assets \
  u3681001@server131.hosting.reg.ru:www/volkova-gyn.ru/
