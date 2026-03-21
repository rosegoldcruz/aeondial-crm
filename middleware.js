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
  const allowDevBypass =
    process.env.NODE_ENV !== "production" &&
    process.env.ALLOW_DEV_DIALER_BYPASS === "true"
  const allowDevDialerApi =
    allowDevBypass && isDevDialerApiRoute(req)
  const allowDevDialerRoute =
    allowDevBypass && isDevDialerRoute(req)
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
