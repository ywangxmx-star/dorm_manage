import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getMyRooms as getMyRoomsApi } from '@/api/room'
import type { Room } from '@/types/room'

function normalizeRoom(room: Room): Room {
  return {
    ...room,
    room_name: room.room_name || '',
    notice: room.notice ?? '',
  }
}

export const useRoomStore = defineStore('room', () => {
  const currentRoom = ref<Room | null>(null)
  const myRooms = ref<Room[]>([])

  async function fetchMyRooms() {
    if (!uni.getStorageSync('token')) {
      myRooms.value = []
      currentRoom.value = null
      return
    }
    try {
      const res = await getMyRoomsApi()
      myRooms.value = (res.data ?? []).map(normalizeRoom)
      if (currentRoom.value && !myRooms.value.find(r => r.id === currentRoom.value!.id)) {
        currentRoom.value = null
      }
      if (myRooms.value.length > 0 && !currentRoom.value) {
        const savedId = uni.getStorageSync('currentRoomId') as number | undefined
        const saved = savedId ? myRooms.value.find(r => r.id === savedId) : null
        currentRoom.value = saved || myRooms.value[0]
      }
      if (currentRoom.value) {
        const latest = myRooms.value.find(r => r.id === currentRoom.value!.id)
        if (latest) currentRoom.value = latest
      }
    } catch {
      myRooms.value = []
      currentRoom.value = null
    }
  }

  function setCurrentRoom(room: Room) {
    currentRoom.value = normalizeRoom(room)
    uni.setStorageSync('currentRoomId', room.id)
  }

  function handleLeaveRoom(roomId: number) {
    myRooms.value = myRooms.value.filter(r => r.id !== roomId)
    if (currentRoom.value?.id === roomId) {
      currentRoom.value = myRooms.value.length > 0 ? myRooms.value[0] : null
    }
  }

  function clearRooms() {
    currentRoom.value = null
    myRooms.value = []
  }

  return { currentRoom, myRooms, fetchMyRooms, setCurrentRoom, handleLeaveRoom, clearRooms }
})
