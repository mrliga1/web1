import { NextResponse } from "next/server";
import { loadHomePageInitialData } from "../../../src/lib/serverData";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = await loadHomePageInitialData();

  return NextResponse.json(
    {
      products: data.products,
      projects: data.projects,
      news: data.news,
    },
    {
      headers: {
        "Cache-Control": "private, no-store",
      },
    },
  );
}
