const $map = [];

const width = 7;
const height = 5;
const isPass = 1;
const isNotPass = 0;
for (let i = 0; i < height; i++) {
  $map[i] = [];
  for (let j = 0; j < width; j++) {
    $map[i][j] = 0;
  }
}

log($map);

function log(data) {
  console.log(data);
}

function getNextBlock(nowPosition = { x: 0, y: 0 }, nextDirection = "down") {

  for (let i = 0; i < height; i++) {
    for (let j = 0; j < width; j++) {

    }
  }
}

// 1. 获取地图

// 2. 设置初始位置和结束位置

// 3. 队列存放搜索位置 queue
