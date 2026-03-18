import { SignUp } from "@clerk/nextjs"

export default function RegisterPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-neutral-950 px-3 py-6 sm:px-4 sm:py-10">
      <div className="w-full max-w-[420px]">
        <SignUp
          path="/register"
          routing="path"
          signInUrl="/"
          fallbackRedirectUrl="/dialer"
        />
      </div>
    </main>
  )
}
