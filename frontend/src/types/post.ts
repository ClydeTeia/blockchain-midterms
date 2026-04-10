export interface PostViewModel {
  id: bigint;
  creator: string;
  imageUrl: string;
  caption: string;
  metadataURI: string;
  likes: bigint;
  totalEarned: bigint;
  timestamp: bigint;
  hasLiked: boolean;
  isOwnPost: boolean;
}

export type TxStatus = "idle" | "loading" | "success" | "error";

export interface TxState {
  status: TxStatus;
  message: string;
}
