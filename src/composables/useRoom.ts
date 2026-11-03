import { useRoomStore } from '@/stores/room'
import { storeToRefs } from 'pinia'
import { getRoomDetail } from '@/api/room'

export function useRoom() {
  const roomStore = useRoomStore()
  const { currentRoom, myRooms } = storeToRefs(roomStore)

  async function loadRooms() {
    await roomStore.fetchMyRooms()
  }

  async function selectRoom(roomId: number) {
    const res = await getRoomDetail(roomId)
    roomStore.setCurrentRoom(res.data)
  }

  return {
    currentRoom,
    myRooms,
    loadRooms,
    selectRoom,
  }
}
