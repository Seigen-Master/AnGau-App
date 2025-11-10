
import LoginForm from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background to-secondary p-4">
      <LoginForm />
      <footer className="mt-8 text-center text-xs text-muted-foreground">
        <p>© 2025 AnGau LLC. All rights reserved.</p>
        <p>AnGau Care App is developed by Parable Interactive.</p>
      </footer>
    </main>
  );
}
