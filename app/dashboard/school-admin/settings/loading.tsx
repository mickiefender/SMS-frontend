import { CircularLoader } from "@/components/circular-loader"

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <CircularLoader />
    </div>
  )
}

