import { getTimeline } from "@/lib/timeline";

// Emitted once at build time as /timeline/data.json, so every moment page shares one cached download.
export const dynamic = "force-static";

export function GET() {
  return Response.json(getTimeline());
}
