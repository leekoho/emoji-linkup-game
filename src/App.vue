<template>
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
import { reactive } from 'vue'
import EmojiBlock from '@/components/EmojiBlock.vue'
import type { Offset, Position } from './typing'

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

const board = reactive(
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

const onDragEnd = (block: Block, offset: Offset) => {
  const index = board.indexOf(block)
  const sourceTargetPosition = changeBlockPosition(index, offset)

  sourceTargetPosition.forEach(position => {
    const linkedPositions = getLinkedPositions(position)

    linkedPositions.forEach(positions => {
      setTimeout(() => {
        // 清空已连接的block
        positions.forEach(position => {
          const index = getIndexByPosition(position)
          board[index].emoji = ''
        })
      }, 300)

      // 上面部分往下掉
      setTimeout(() => {
        moveWillDownBlock(positions)
      }, 500)

      // 将空的快随机生成新的emojis
      setTimeout(() => {
        board.forEach(block => {
          if (!block.emoji) {
            block.emoji = getRandomEmoji()
          }
        })
      }, 1000)
    })
  })
}

/**
 * 更换位置
 * @param sourceIndex
 * @param offset 偏移位置
 * @return 交换过的两个坐标
 */
const changeBlockPosition = (sourceIndex: number, offset: Offset): [Position, Position] | [] => {
  // const sourceIndex = board.indexOf(source)
  const [sourceX, sourceY] = getPositionByIndex(sourceIndex)
  const [offsetX, offsetY] = offset
  const targetX = sourceX + offsetX
  const targetY = sourceY + offsetY
  const targetIndex = getIndexByPosition([targetX, targetY])

  const element = document.getElementById(board[sourceIndex].id) as HTMLElement
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
  (board[sourceIndex] = board.splice(targetIndex, 1, board[sourceIndex])[0])

// 获取需要检测的坐标
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
    const checkEmojis = positions.map(position => board[getIndexByPosition(position)].emoji)
    // 这三个块的emoji是否一样
    return checkEmojis.every(emoji => emoji === checkEmojis[0])
  })
}

enum Direction {
  HORIZONTAL,
  VERTICAL,
}

/**
 * 移动将要往下掉的快
 * @param positions
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
