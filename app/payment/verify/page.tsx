import { Suspense } from "react"
import PaymentVerification from "@/components/payments/PaymentVerification"

export default function VerifyPaymentPage() {
  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4">
      <Suspense
        fallback={
          <div className="max-w-md mx-auto text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        }
      >
        <PaymentVerification />
      </Suspense>
    </div>
  )
}
