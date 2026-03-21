import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"

const isPublicRoute = createRouteMatcher([
  "/",
  "/login(.*)",
  "/register(.*)",
  "/api/health(.*)",
])
const isDevDialerApiRoute = createRouteMatcher([
  "/api/dialer/(.*)",
])
const isDevDialerRoute = createRouteMatcher([
  "/dialer(.*)",
])

export default clerkMiddleware(async (auth, req) => {
  const allowDevDialerApi =
    process.env.NODE_ENV !== "production" && isDevDialerApiRoute(req)
  const allowDevDialerRoute =
    process.env.NODE_ENV !== "production" && isDevDialerRoute(req)
  if (!isPublicRoute(req) && !allowDevDialerApi && !allowDevDialerRoute) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpg|jpeg|gif|png|webp|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
}
