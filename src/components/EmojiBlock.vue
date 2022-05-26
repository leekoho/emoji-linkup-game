<template>
  <span @touchstart="onTouchStart" @touchmove="onTouchMove" @touchend="onTouchEnd">
    <slot />
  </span>
</template>

<script lang="ts" setup>
import type { Offset } from '../typing'

const emits = defineEmits(['drag-end'])

// 开始位置
const startPosition = { x: 0, y: 0 }
// 结束位置
const endPosition = { x: 0, y: 0 }

const onTouchStart = (e: TouchEvent) => {
  const { pageX, pageY } = e.targetTouches[0]
  startPosition.x = pageX
  startPosition.y = pageY
}

const onTouchMove = (e: TouchEvent) => {
  const { pageX, pageY } = e.targetTouches[0]
  endPosition.x = pageX
  endPosition.y = pageY
}

const onTouchEnd = () => {
  const offset: Offset = [0, 0]
  const x = endPosition.x - startPosition.x
  const y = endPosition.y - startPosition.y
  if (Math.abs(x) > Math.abs(y) && x > 0) {
    // right
    offset[0] += 1
  } else if (Math.abs(x) > Math.abs(y) && x < 0) {
    // left
    offset[0] -= 1
  } else if (Math.abs(y) > Math.abs(x) && y > 0) {
    // bottom
    offset[1] += 1
  } else if (Math.abs(y) > Math.abs(x) && y < 0) {
    // top
    offset[1] -= 1
  }

  emits('drag-end', offset)
}
</script>
