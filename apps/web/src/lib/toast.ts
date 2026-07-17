import { toast } from "react-hot-toast"

export function dismissToast(toastId: string) {
  toast.dismiss(toastId)
}
