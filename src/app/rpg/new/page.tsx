import { redirect } from "next/navigation"

export default function NewRpgPage() {
  redirect("/rpg?modal=create&editor=rpg")
}
