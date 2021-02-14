# Cheat Machine For Lansiny Engine

目前代码写得挺乱。

``` shell
# 转换地图
yarn start buildMap --auto-truncate

# 生成游戏
yarn start buildGame --map var/Map011.yml --initial "(11,0,6)" --target "(11,10,6)" var/Game01.yml

# 计算策略
yarn start run --game var/Game01.yml
```
