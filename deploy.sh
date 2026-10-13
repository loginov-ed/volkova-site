#!/bin/zsh
# Публикация сайта на хостинг REG.RU (volkova-gyn.ru) по SSH-ключу ~/.ssh/volkova_hosting.
# Перед загрузкой проставляет в index.html метки версий (?v=...) у CSS/JS,
# чтобы браузеры не показывали старые файлы из кэша. Ничего на сервере не удаляет.
set -e
cd "$(dirname "$0")"
for f in styles.css main.js reviews.js; do
  v=$(md5 -q "$f" | cut -c1-8)
  sed -i '' -E "s#(\"${f//./\\.})(\\?v=[a-z0-9]*)?\"#\\1?v=${v}\"#" index.html
done
rsync -rtvz --checksum --exclude '.DS_Store' \
  -e "ssh -i $HOME/.ssh/volkova_hosting -o BatchMode=yes -o IdentitiesOnly=yes" \
  index.html styles.css main.js reviews.js assets \
  u3681001@server131.hosting.reg.ru:www/volkova-gyn.ru/
