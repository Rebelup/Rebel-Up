import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { Dumbbell } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-sm">
        <div className="bg-card rounded-2xl shadow-xl p-8 flex flex-col items-center gap-6">
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
              <Dumbbell className="w-8 h-8 text-white" />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-foreground">Rebel-Up</h1>
              <p className="text-sm text-muted-foreground mt-1">
                피트니스 커뮤니티에 오신 걸 환영해요
              </p>
            </div>
          </div>

          <div className="w-full space-y-3">
            <p className="text-center text-sm text-muted-foreground">
              운동 · 식단 · 보충제 정보를 함께 나눠요
            </p>
            <GoogleSignInButton />
          </div>

          <p className="text-xs text-muted-foreground text-center">
            로그인 시 서비스 이용약관에 동의하게 됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}
