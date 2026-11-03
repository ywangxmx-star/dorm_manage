import { ref } from 'vue'
import { getTaskList } from '@/api/task'
import { getBillList } from '@/api/bill'
import { getVoteList } from '@/api/vote'
import { useAuthStore } from '@/stores/auth'
import { useRoomStore } from '@/stores/room'
import { ExecutorStatus, TaskStatus } from '@/types/task'

const ACTIVE_EXECUTOR_STATUSES = new Set([
  ExecutorStatus.PENDING_ACCEPT,
  ExecutorStatus.ACCEPTED,
  ExecutorStatus.PENDING_AUDIT,
  ExecutorStatus.REJECTED_BY_AUDIT,
])

const INACTIVE_TASK_STATUSES = new Set([
  TaskStatus.COMPLETED,
  TaskStatus.REJECTED,
  TaskStatus.CANCELLED,
])

export function useMineRoomStats() {
  const authStore = useAuthStore()
  const roomStore = useRoomStore()
  const loading = ref(false)
  const myPendingTaskCount = ref(0)
  const myUnpaidBillCount = ref(0)
  const myPendingVoteCount = ref(0)

  async function loadStats() {
    const roomId = roomStore.currentRoom?.id
    const userId = authStore.userInfo?.id
    if (!roomId || !userId) {
      myPendingTaskCount.value = 0
      myUnpaidBillCount.value = 0
      myPendingVoteCount.value = 0
      return
    }

    loading.value = true
    try {
      const [taskRes, billRes, voteRes] = await Promise.all([
        getTaskList({ room_id: roomId, execute_user_id: userId, page: 1, page_size: 100 }),
        getBillList({ room_id: roomId, page: 1, page_size: 100 }),
        getVoteList({ room_id: roomId, page: 1, page_size: 100 }),
      ])

      myPendingTaskCount.value = taskRes.data.items.filter((task) => {
        if (INACTIVE_TASK_STATUSES.has(task.status)) return false
        const mine = task.executors.find((ex) => ex.user_id === userId)
        if (!mine) return false
        return ACTIVE_EXECUTOR_STATUSES.has(mine.status)
      }).length

      myUnpaidBillCount.value = billRes.data.items.filter(
        (bill) => !bill.is_settled && bill.my_pay_status !== 2,
      ).length

      myPendingVoteCount.value = voteRes.data.items.filter(
        (vote) => vote.status === 0 && !vote.has_voted,
      ).length
    } catch {
      myPendingTaskCount.value = 0
      myUnpaidBillCount.value = 0
      myPendingVoteCount.value = 0
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    myPendingTaskCount,
    myUnpaidBillCount,
    myPendingVoteCount,
    loadStats,
  }
}
