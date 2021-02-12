# Cheat Engine For Lansiny Engine

目前代码写得挺乱。

``` shell
# 转换地图
yarn start buildMapFromJSON var/upstream/Map010.json var/Map010.yml --auto-truncate

# 生成游戏
yarn start buildGame --map var/Map010.yml --initial "(10,0,6)" --target "(10,11,6)" var/Game01.yml

# 计算策略
yarn start run --game var/Game01.yml
```
