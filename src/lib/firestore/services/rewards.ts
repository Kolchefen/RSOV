import {
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  increment,
} from "firebase/firestore"
import { rewardsCol, transactionsCol, rewardDoc, transactionDoc, userDoc } from "../collections"
import type {
  RewardDocument,
  RewardCategory,
  PointsTransactionDocument,
  TransactionViewModel,
} from "../types"

// ---------------------------------------------------------------------------
// Rewards catalog
// ---------------------------------------------------------------------------

/** Fetch all active rewards. */
export async function getActiveRewards(): Promise<RewardDocument[]> {
  const q = query(rewardsCol, where("is-active", "==", true))
  const snap = await getDocs(q)
  return snap.docs.map((d) => d.data())
}

/** Fetch all rewards (including inactive), for the admin catalog view. */
export async function getAllRewards(): Promise<RewardDocument[]> {
  const snap = await getDocs(rewardsCol)
  return snap.docs.map((d) => d.data())
}

/** Create a new reward item (admin only). */
export async function createReward(fields: {
  name: string
  pointsRequired: number
  category: RewardCategory
  stock: number
}): Promise<string> {
  const ref = await addDoc(rewardsCol, {
    id: "",                                      // will be patched below
    name: fields.name,
    "points-required": fields.pointsRequired,
    category: fields.category,
    stock: fields.stock,
    "total-redemptions": 0,
    "is-active": true,
    "created-at": serverTimestamp(),
  } as unknown as RewardDocument)

  // Store the auto-generated ID back into the document
  await updateDoc(ref, { id: ref.id })
  return ref.id
}

/** Update stock or active status of an existing reward. */
export async function updateReward(
  rewardId: string,
  fields: Partial<Pick<RewardDocument, "name" | "points-required" | "stock" | "is-active" | "category">>
): Promise<void> {
  await updateDoc(rewardDoc(rewardId), {
    ...fields,
    "updated-at": serverTimestamp(),
  } as Record<string, unknown>)
}

// ---------------------------------------------------------------------------
// Points transactions
// ---------------------------------------------------------------------------

/** Fetch recent transactions, optionally filtered by type. */
export async function getRecentTransactions(
  n = 50,
  typeFilter?: "earned" | "redeemed" | "bonus"
): Promise<TransactionViewModel[]> {
  const constraints = [orderBy("created-at", "desc"), limit(n)]
  if (typeFilter) constraints.unshift(where("type", "==", typeFilter) as typeof constraints[0])

  const q = query(transactionsCol, ...constraints)
  const snap = await getDocs(q)

  const viewModels: TransactionViewModel[] = []

  for (const d of snap.docs) {
    const txn = d.data()
    const userSnap = await getDoc(userDoc(txn["user-id"]))
    const userName = userSnap.exists() ? userSnap.data().name : txn["user-id"]
    const initials = userName
      .split(" ")
      .map((w: string) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)

    viewModels.push({
      id: txn.id,
      student: { name: userName, avatar: initials },
      type: txn.type,
      amount: txn.amount,
      description: txn.description,
      timestamp: txn["created-at"].toDate().toLocaleString(),
      category: txn.category,
    })
  }

  return viewModels
}

/** Get all transactions for a specific user. */
export async function getUserTransactions(
  uid: string
): Promise<PointsTransactionDocument[]> {
  const q = query(
    transactionsCol,
    where("user-id", "==", uid),
    orderBy("created-at", "desc")
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => d.data())
}

/** Admin: grant bonus points to a user. Creates a transaction and updates total-points. */
export async function grantBonusPoints(
  uid: string,
  amount: number,
  reason: string
): Promise<void> {
  const ref = await addDoc(transactionsCol, {
    id: "",
    "user-id": uid,
    type: "bonus",
    amount,
    description: reason,
    category: "bonus",
    "created-at": serverTimestamp(),
  } as unknown as PointsTransactionDocument)

  await updateDoc(ref, { id: ref.id })
  await updateDoc(userDoc(uid), { "total-points": increment(amount) })
}

/** Redeem a reward for a user. Validates stock and deducts points. */
export async function redeemReward(uid: string, rewardId: string): Promise<void> {
  const rewardSnap = await getDoc(rewardDoc(rewardId))
  if (!rewardSnap.exists()) throw new Error("Reward not found")

  const reward = rewardSnap.data()
  if (!reward["is-active"]) throw new Error("Reward is no longer active")
  if (reward.stock <= 0) throw new Error("Reward is out of stock")

  const userSnap = await getDoc(userDoc(uid))
  if (!userSnap.exists()) throw new Error("User not found")

  const currentPoints = userSnap.data()["total-points"] ?? 0
  if (currentPoints < reward["points-required"]) {
    throw new Error("Insufficient points")
  }

  // Deduct points from user
  await updateDoc(userDoc(uid), {
    "total-points": increment(-reward["points-required"]),
  })

  // Decrement stock and increment redemption count
  await updateDoc(rewardDoc(rewardId), {
    stock: increment(-1),
    "total-redemptions": increment(1),
    "updated-at": serverTimestamp(),
  })

  // Record the transaction
  const ref = await addDoc(transactionsCol, {
    id: "",
    "user-id": uid,
    type: "redeemed",
    amount: reward["points-required"],
    description: reward.name,
    category: reward.category,
    "reward-id": rewardId,
    "created-at": serverTimestamp(),
  } as unknown as PointsTransactionDocument)

  await updateDoc(ref, { id: ref.id })
}

/** Record earned points after a completed ride (called from admin or Cloud Function). */
export async function recordEarnedPoints(
  uid: string,
  points: number,
  description: string,
  rideId: string
): Promise<void> {
  const ref = await addDoc(transactionsCol, {
    id: "",
    "user-id": uid,
    type: "earned",
    amount: points,
    description,
    category: "ride",
    "ride-id": rideId,
    "created-at": serverTimestamp(),
  } as unknown as PointsTransactionDocument)

  await updateDoc(ref, { id: ref.id })
  await updateDoc(userDoc(uid), { "total-points": increment(points) })
}
