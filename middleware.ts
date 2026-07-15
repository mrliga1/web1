import { NextRequest, NextResponse } from "next/server";
import { generateSlug } from "./src/lib/utils";

export function middleware(request: NextRequest) {
  const match = request.nextUrl.pathname.match(
    /^\/(category-product|category-news)\/([^/]+)\/?$/,
  );

  if (!match) {
    return NextResponse.next();
  }

  let categoryName: string;
  try {
    categoryName = decodeURIComponent(match[2]);
  } catch {
    return NextResponse.next();
  }

  const canonicalSlug = generateSlug(categoryName);
  const canonicalPath = `/${match[1]}/${canonicalSlug}`;

  if (!canonicalSlug || request.nextUrl.pathname === canonicalPath) {
    return NextResponse.next();
  }

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = canonicalPath;
  return NextResponse.redirect(redirectUrl, 308);
}

export const config = {
  matcher: ["/category-product/:path*", "/category-news/:path*"],
};
