import { CircularLoader } from "@/components/circular-loader"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Filters Loading */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-48 h-10 bg-gray-200 rounded-lg animate-pulse" />
            <div className="w-full md:w-48 h-10 bg-gray-200 rounded-lg animate-pulse" />
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards Loading */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="h-20 bg-gray-200 rounded-lg animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Loading */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="h-6 bg-gray-200 rounded w-40 animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="h-80 bg-gray-200 rounded-lg animate-pulse" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="h-6 bg-gray-200 rounded w-40 animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="h-80 bg-gray-200 rounded-lg animate-pulse" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

