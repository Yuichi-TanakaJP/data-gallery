# Supabase client/server 分離の理由

## 背景

Supabase を Next.js (App Router) で利用する中で、
client / server / service role の責務が混在していた。

## 問題

- API Route から browser client を誤って import できてしまう
- SERVICE_ROLE_KEY が client bundle に混入するリスクがある
- build は通るが runtime で壊れるケースが発生した

## 判断

- browser 用 client と server 用 client をファイルで分離する
- server 用 client は `server-only` を明示する
- API Route では server admin client のみを使用する

## 結果

- import ミスが構造的に起きなくなった
- runtime エラーの切り分けが容易になった
- client / server の責務が明確になった
