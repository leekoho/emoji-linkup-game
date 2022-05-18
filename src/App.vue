<template>
  <p class="py-2 text-center text-sm text-yellow-500">当前滑动方向: {{ direction }}</p>
  <div
    class="grid gap-2 p-2"
    :style="{
      'grid-template-rows': `repeat(1, minmax(${ROW}, 1fr))`,
      'grid-template-columns': `repeat(${COL}, minmax(0, 1fr))`,
    }">
    <template v-for="(item, row) in matrix">
      <span
        v-for="(child, col) in item"
        :key="row + '-' + col"
        :id="row + '-' + col"
        class="inline-block text-3xl text-center select-none animate-animated"
        :data-row="row"
        :data-col="col"
        @touchstart="onTouchStart"
        @touchmove="onTouchMove"
        @touchend="onTouchEnd">
        {{ child }}
      </span>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref, computed } from 'vue'
import { capitalize } from 'lodash-es'

interface Position {
  x: number
  y: number
}

interface Coord {
  row: number
  col: number
}

enum Direction {
  UP = 'up',
  DOWN = 'down',
  LEFT = 'left',
  RIGHT = 'right',
}

const emojis = ['🐶', '🐱', '🐭', '🐰', '🦊', '🐻', '🐼', '🐸', '🐯', '🐷', '🐵', '🦄']
const ROW = 14
const COL = 7
const matrix = reactive(
  Array.from({ length: ROW }).map(v =>
    Array.from({ length: COL }).map(v => emojis[Math.ceil(Math.random() * emojis.length - 1)])
  )
)

// 开始位置
const startPos: Position = { x: 0, y: 0 }
// 结束位置
const endPos: Position = { x: 0, y: 0 }
// 滑动方向
const direction = ref<Direction | null>(null)
// 开始坐标
const startCoord: Coord = reactive({ row: 0, col: 0 })
// 结束坐标
const endCoord: Coord = reactive({ row: 0, col: 0 })
// 当前元素
const source = computed({
  get: () => matrix[startCoord.row][startCoord.col],
  set: val => {
    matrix[startCoord.row][startCoord.col] = val
  },
})

const onTouchStart = (e: TouchEvent) => {
  const { pageX, pageY } = e.targetTouches[0]
  startPos.x = pageX
  startPos.y = pageY

  const target = e.target as HTMLElement
  const { row, col } = target.dataset
  if (row && col) {
    startCoord.row = parseInt(row)
    startCoord.col = parseInt(col)
  }
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
  } else {
    direction.value = null
  }

  if (
    !direction.value ||
    (direction.value === Direction.UP && startCoord.row === 0) ||
    (direction.value === Direction.DOWN && startCoord.row === ROW - 1) ||
    (direction.value === Direction.LEFT && startCoord.col === 0) ||
    (direction.value === Direction.RIGHT && startCoord.col === COL - 1)
  ) {
    errorAnimate(e.target as HTMLElement)
    return
  }

  endCoord.row =
    direction.value === Direction.LEFT || direction.value === Direction.RIGHT
      ? startCoord.row
      : direction.value === Direction.UP
      ? startCoord.row - 1
      : startCoord.row + 1

  endCoord.col =
    direction.value === Direction.UP || direction.value === Direction.DOWN
      ? startCoord.col
      : direction.value === Direction.LEFT
      ? startCoord.col - 1
      : startCoord.col + 1

  changeCoord(startCoord, endCoord, direction.value)
}

const errorAnimate = (element: HTMLElement) => {
  if (!direction.value) return
  const cls = [Direction.LEFT, Direction.RIGHT].includes(direction.value)
    ? 'animate-shakeX'
    : 'animate-shakeY'
  element.classList.add(cls)

  setTimeout(() => {
    element.classList.remove(cls)
  }, 500)
}

const changeCoord = (startCoord: Coord, endCoord: Coord, direction: Direction) => {
  const sourceEl = document.getElementById(
    `${startCoord.row + '-' + startCoord.col}`
  ) as HTMLElement
  const { width, height } = sourceEl.getBoundingClientRect()

  const targetEl = document.getElementById(`${endCoord.row + '-' + endCoord.col}`) as HTMLElement

  const GAP = 8
  const TRANSITION_DURATION = 150
  const translateX =
    direction === Direction.LEFT ? -(width + GAP) : direction === Direction.RIGHT ? width + GAP : 0
  const translateY =
    direction === Direction.UP ? -(height + GAP) : direction === Direction.DOWN ? height + GAP : 0
  sourceEl.style.transform = `translate3d(${translateX}px, ${translateY}px, 0)`
  sourceEl.style.transition = `transform ${TRANSITION_DURATION}ms ease-in-out`
  targetEl.style.transform = `translate3d(${-translateX}px, ${-translateY}px, 0)`
  targetEl.style.transition = `transform ${TRANSITION_DURATION}ms ease-in-out`

  setTimeout(() => {
    const temp = matrix[startCoord.row][startCoord.col]
    matrix[startCoord.row][startCoord.col] = matrix[endCoord.row][endCoord.col]
    matrix[endCoord.row][endCoord.col] = temp

    sourceEl.style.transform = ''
    sourceEl.style.transition = ''
    targetEl.style.transform = ''
    targetEl.style.transition = ''
  }, TRANSITION_DURATION)
}
</script>

<style lang="scss">
body {
  touch-action: none;
}
</style>
