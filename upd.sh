git add . ; git commit -m $1 ; git push
# xh POST https://hass.sal.net.br/api/hassio/store/refresh \
#   Authorization="Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJjYjBiMmZhNjcyMmQ0YjdiOWE1ZjM4NjgwOTc3YmRkMiIsImlhdCI6MTc3MDAyOTU4NCwiZXhwIjoyMDg1Mzg5NTg0fQ.LqkZG85reW-uDICWw9XKaOlTzD1oUvXozZS-tulY5mA"

xh POST https://hass.sal.net.br/api/store/reload \
  Authorization:"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJjYjBiMmZhNjcyMmQ0YjdiOWE1ZjM4NjgwOTc3YmRkMiIsImlhdCI6MTc3MDAyOTU4NCwiZXhwIjoyMDg1Mzg5NTg0fQ.LqkZG85reW-uDICWw9XKaOlTzD1oUvXozZS-tulY5mA" \
#   addon=db25358c_sorj_net_manager


# xh POST https://hass.sal.net.br/api/hassio/addons/db25358c_sorj_net_manager/update \
#     "Authorization: Bearer "
