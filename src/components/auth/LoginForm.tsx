
'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, HeartHandshake } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const { login, loading, user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      router.replace(user.role === 'admin' ? '/admin/dashboard' : '/caregiver/dashboard');
    }
  }, [user, router]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
    } catch (error) {
      // Errors are handled in the login function
    }
  };

  if (loading || user) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background">
        <div className="flex items-center">
            <HeartHandshake className="h-10 w-10 text-primary animate-pulse" />
            <p className="ml-4 text-lg font-semibold text-muted-foreground">Authenticating...</p>
        </div>
      </div>
    );
  }

  return (
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
             <HeartHandshake className="w-16 h-16 text-primary" />
          </div>
          <CardTitle className="text-3xl font-headline">AnGau Care</CardTitle>
          <CardDescription>Log in to access your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="pt-4">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign In
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }
