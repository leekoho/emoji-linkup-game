<template>
  <div @click="shuffleBoard">打乱位置</div>
  <transition-group
    name="block"
    tag="div"
    class="grid gap-2 p-2"
    :style="{
      'grid-template-rows': `repeat(${ROW}, minmax(0, 1fr))`,
      'grid-template-columns': `repeat(${COL}, minmax(0, 1fr))`,
    }"
  >
    <EmojiBlock
      v-for="block in board"
      :key="block.id"
      :id="block.id"
      class="block"
      @drag-end="(offset: Offset) => onDragEnd(block, offset)"
    >
      {{ block.emoji }}
    </EmojiBlock>
  </transition-group>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import EmojiBlock from '@/components/EmojiBlock.vue'
import type { Offset, Position } from './typing'
import { Direction } from './typing'
import { shuffle } from 'lodash-es'

interface Block {
  id: ReturnType<typeof generateId>
  emoji: string
}

const generateId = () => URL.createObjectURL(new Blob()).slice(-12)

const emojis = ['🐶', '🐱', '🐭', '🐰', '🦊', '🐻', '🐼', '🐸', '🐯', '🐷', '🐵', '🦄']
const getRandomEmoji = () => emojis[Math.floor(Math.random() * emojis.length)]

// 行
const ROW = 14
// 列
const COL = 6
// 连线范围
const RANGE = 3

const board = ref(
  Array.from(
    {
      length: ROW * COL,
    },
    (): Block => ({
      id: generateId(),
      emoji: getRandomEmoji(),
    })
  )
)

const getPositionByIndex = (index: number): Position => [index % COL, Math.floor(index / COL)]

const getIndexByPosition = ([x, y]: Position): number => y * COL + x

// 延迟执行
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const shuffleBoard = () => (board.value = shuffle(board.value))

const onDragEnd = async (block: Block, offset: Offset) => {
  const index = board.value.indexOf(block)
  const sourcePosition = getPositionByIndex(index)
  const swappedPosition = changeBlockPosition(sourcePosition, offset)

  let linked = false
  swappedPosition.forEach(position => {
    const linkedPositions = getLinkedPositions(position)

    if (linkedPositions.length) {
      linked = true
    }

    linkedPositions.forEach(async positions => {
      await sleep(500)
      // 清空已连接的block
      positions.forEach(position => {
        const index = getIndexByPosition(position)
        board.value[index].emoji = ''
      })
      // 上面部分往下掉
      moveWillDownBlock(positions)

      // 将空的快随机生成新的emojis
      await sleep(500)
      board.value.forEach(block => {
        if (!block.emoji) {
          block.emoji = getRandomEmoji()
        }
      })
    })
  })

  if (!linked) {
    await sleep(500)
    changeBlockPosition(sourcePosition, offset)
  }
}

const getTargetPositionByOffset = (sourcePosition: Position, offset: Offset): Position => {
  const [sourceX, sourceY] = sourcePosition
  const [offsetX, offsetY] = offset
  return [sourceX + offsetX, sourceY + offsetY]
}

/**
 * 更换位置
 * @param sourcePosition 开始位置
 * @param offset 偏移位置
 * @return 交换过的两个坐标
 */
const changeBlockPosition = (
  sourcePosition: Position,
  offset: Offset
): [Position, Position] | [] => {
  const sourceIndex = getIndexByPosition(sourcePosition)
  const [sourceX, sourceY] = getPositionByIndex(sourceIndex)
  const [targetX, targetY] = getTargetPositionByOffset(sourcePosition, offset)
  const targetIndex = getIndexByPosition([targetX, targetY])

  const element = document.getElementById(board.value[sourceIndex].id) as HTMLElement
  let cls = ['animate-animated']
  if (targetX < 0 || targetX >= COL) {
    cls.push('animate-shakeX')
  }

  if (targetY < 0 || targetY >= ROW) {
    cls.push('animate-shakeY')
  }

  if (cls.length > 1) {
    element.classList.add(...cls)
    setTimeout(() => {
      element.classList.remove(...cls)
    }, 500)
    return []
  }

  // 交换数组位置
  swap(sourceIndex, targetIndex)

  return [
    [sourceX, sourceY],
    [targetX, targetY],
  ]
}

// 交换位置
const swap = (sourceIndex: number, targetIndex: number) =>
  (board.value[sourceIndex] = board.value.splice(targetIndex, 1, board.value[sourceIndex])[0])

/**
 * 获取需要检测的坐标
 * @param position 位置
 * @return 周围需要检查的3个点
 */
const getCheckPositions = ([x, y]: Position): Position[][] => {
  // [2, 0]
  return [
    // 横向需要检测的坐标
    // [0, 0][1, 0][2, 0]
    // [1, 0][2, 0][3, 0]
    // [2, 0][3, 0][4, 0]
    ...Array.from({ length: RANGE }, (_, i): Position[] => {
      const start = x - (RANGE - 1) + i
      const end = start + 2
      if (start < 0 || start >= COL || end < 0 || end >= COL) return []
      return [
        [start, y],
        [start + 1, y],
        [end, y],
      ]
    }).filter(t => t.length),
    ...Array.from({ length: RANGE }, (_, i): Position[] => {
      const start = y - (RANGE - 1) + i
      const end = start + 2
      if (start < 0 || start >= ROW || end < 0 || end >= ROW) return []
      return [
        [x, start],
        [x, start + 1],
        [x, start + 2],
      ]
    }).filter(t => t.length),
  ]
}

/**
 * 获取已连接的坐标
 * @param position
 * @return 已连接的坐标
 */
const getLinkedPositions = (position: Position): Position[][] => {
  const checkPositions = getCheckPositions(position)

  return checkPositions.filter(positions => {
    const checkEmojis = positions.map(position => board.value[getIndexByPosition(position)].emoji)
    // 这三个块的emoji是否一样
    return checkEmojis.every(emoji => emoji === checkEmojis[0])
  })
}

/**
 * 移动将要往下掉的快
 * @param positions 已经空掉的block的坐标
 */
const moveWillDownBlock = (positions: Position[]): void => {
  const direction: Direction = positions.every(([x]) => x === positions[0][0])
    ? Direction.VERTICAL
    : Direction.HORIZONTAL

  const [[startX, startY], , [endX, endY]] = positions
  if (direction === Direction.VERTICAL) {
    for (let y = startY - 1; y >= 0; y--) {
      swap(getIndexByPosition([startX, y]), getIndexByPosition([startX, y + RANGE]))
    }
  } else {
    for (let x = startX; x <= endX; x++) {
      for (let y = endY - 1; y >= 0; y--) {
        swap(getIndexByPosition([x, y + 1]), getIndexByPosition([x, y]))
      }
    }
  }
}
</script>

<style lang="scss">
body {
  @apply touch-none;
}

.block {
  @apply inline-block text-3xl text-center select-none transition;
}

.block-move {
  @apply transition-transform duration-500;
}
</style>
