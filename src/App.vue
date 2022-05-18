<template>
  <p class="py-2 text-center text-sm text-yellow-500">当前滑动方向: {{ direction }}</p>
  <transition-group
    name="list"
    tag="div"
    mode="in-out"
    class="grid gap-2 p-2"
    :style="{
      'grid-template-rows': `repeat(1, minmax(${ROW}, 1fr))`,
      'grid-template-columns': `repeat(${COL}, minmax(0, 1fr))`,
    }">
    <span
      v-for="(item, idx) in items"
      :key="item.id"
      :id="item.id"
      :data-row="item.row"
      :data-col="item.col"
      class="inline-block text-3xl text-center select-none"
      @touchstart="onTouchStart($event, idx)"
      @touchmove="onTouchMove"
      @touchend="onTouchEnd">
      {{ item.label }}
    </span>
  </transition-group>
</template>

<script lang="ts" setup>
import { shuffle } from 'lodash-es'
import { reactive, ref } from 'vue'

interface Position {
  x: number
  y: number
}

enum Direction {
  UP = 'up',
  DOWN = 'down',
  LEFT = 'left',
  RIGHT = 'right',
}

interface Item {
  id: ReturnType<typeof generateId>
  row: number
  col: number
  label: string
}

const generateId = () => URL.createObjectURL(new Blob()).slice(-36)

const emojis = ['🐶', '🐱', '🐭', '🐰', '🦊', '🐻', '🐼', '🐸', '🐯', '🐷', '🐵', '🦄']
const ROW = 14
const COL = 7

const initItems = (): Item[] =>
  Array.from({ length: ROW * COL }).map((_, i) => ({
    id: generateId(),
    row: Math.floor(i / COL),
    col: i % COL,
    label: emojis[Math.ceil(Math.random() * emojis.length - 1)],
  }))

const items = ref(initItems())

// 开始位置
const startPos: Position = { x: 0, y: 0 }
// 结束位置
const endPos: Position = { x: 0, y: 0 }
// 滑动方向
const direction = ref<Direction>(Direction.UP)

let sourceIdx = -1
let targetIdx = -1

const onTouchStart = (e: TouchEvent, idx: number) => {
  const { pageX, pageY } = e.targetTouches[0]
  startPos.x = pageX
  startPos.y = pageY

  sourceIdx = idx
}

const onTouchMove = (e: TouchEvent) => {
  const { pageX, pageY } = e.targetTouches[0]
  endPos.x = pageX
  endPos.y = pageY
}

const onTouchEnd = (e: TouchEvent) => {
  const x = endPos.x - startPos.x
  const y = endPos.y - startPos.y

  if (Math.abs(x) > Math.abs(y) && x > 0) {
    direction.value = Direction.RIGHT
  } else if (Math.abs(x) > Math.abs(y) && x < 0) {
    direction.value = Direction.LEFT
  } else if (Math.abs(y) > Math.abs(x) && y > 0) {
    direction.value = Direction.DOWN
  } else if (Math.abs(y) > Math.abs(x) && y < 0) {
    direction.value = Direction.UP
  }

  if (sourceIdx <= -1) return

  const sourceItem = items.value[sourceIdx]

  if (
    !direction.value ||
    (direction.value === Direction.UP && sourceItem.row === 0) ||
    (direction.value === Direction.DOWN && sourceItem.row === ROW - 1) ||
    (direction.value === Direction.LEFT && sourceItem.col === 0) ||
    (direction.value === Direction.RIGHT && sourceItem.col === COL - 1)
  ) {
    errorAnimate(e.target as HTMLElement)
    return
  }

  let row = sourceItem.row
  let col = sourceItem.col
  switch (direction.value) {
    case Direction.UP:
      row--
      break
    case Direction.DOWN:
      row++
      break
    case Direction.LEFT:
      col--
      break
    case Direction.RIGHT:
      col++
      break
  }
  targetIdx = items.value.findIndex(item => item.row === row && item.col === col)

  if (direction.value === Direction.LEFT || direction.value === Direction.RIGHT) {
    const temp = items.value[sourceIdx].col
    items.value[sourceIdx].col = items.value[targetIdx].col
    items.value[targetIdx].col = temp
  } else {
    const temp = items.value[sourceIdx].row
    items.value[sourceIdx].row = items.value[targetIdx].row
    items.value[targetIdx].row = temp
  }
  items.value = items.value.sort((a, b) => a.row * 10 + a.col - (b.row * 10 + b.col))
}

const errorAnimate = (element: HTMLElement) => {
  if (!direction.value) return
  const cls = [Direction.LEFT, Direction.RIGHT].includes(direction.value)
    ? 'animate-shakeX'
    : 'animate-shakeY'
  element.classList.add('animate')
  element.classList.add(cls)

  setTimeout(() => {
    element.classList.remove()
    element.classList.remove(cls)
  }, 500)
}
</script>

<style lang="scss">
body {
  touch-action: none;
}

.list-move, /* 对移动中的元素应用的过渡 */
.list-enter-active,
.list-leave-active {
  transition: all 0.5s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

/* 确保将离开的元素从布局流中删除
  以便能够正确地计算移动的动画。 */
.list-leave-active {
  position: absolute;
}

/* 1. declare transition */
.fade-move,
.fade-enter-active,
.fade-leave-active {
  transition: all 0.5s cubic-bezier(0.55, 0, 0.1, 1);
}

/* 2. declare enter from and leave to state */
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: scaleY(0.01) translate(30px, 0);
}

/* 3. ensure leaving items are taken out of layout flow so that moving
      animations can be calculated correctly. */
.fade-leave-active {
  position: absolute;
}
</style>
