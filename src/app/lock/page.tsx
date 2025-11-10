
import PinPad from '@/components/auth/PinPad';

export default function LockPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md">
        <PinPad />
      </div>
      <footer className="mt-8 text-center text-xs text-muted-foreground">
        <p>© 2025 AnGau LLC. All rights reserved.</p>
        <p>AnGau Care App is developed by Parable Interactive.</p>
      </footer>
    </div>
  );
}
