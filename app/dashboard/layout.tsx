'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { MorphingSquare } from '@/components/ui/morphing-square';
import { setupTokenRefresh } from '@/lib/api';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const searchParams = useSearchParams();
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    // 检查是否是登录后的重定向
    const loginSuccess = searchParams.get('login');
    const token = searchParams.get('token');
    const userParam = searchParams.get('user');
    const refreshToken = searchParams.get('refresh_token');
    const expiresIn = searchParams.get('expires_in');

    if (loginSuccess === 'success' && token && userParam) {
      try {
        // Immediately sync to localStorage
        localStorage.setItem('access_token', token);
        localStorage.setItem('user', decodeURIComponent(userParam));
        console.log('Access token synced to localStorage');
        
        // Save refresh_token (critical: must save, otherwise cannot refresh)
        if (refreshToken) {
          localStorage.setItem('refresh_token', refreshToken);
          console.log('Refresh token synced to localStorage:', refreshToken.substring(0, 20) + '...');
        } else {
          console.warn('Warning: Login successful but no refresh_token received');
        }

        // Save token expiration time
        if (expiresIn) {
          const expiresAt = Date.now() + parseInt(expiresIn, 10) * 1000;
          localStorage.setItem('token_expires_at', String(expiresAt));
          console.log('Token expires at:', new Date(expiresAt).toISOString());
        }
      } catch (error) {
        console.error('Failed to sync login data:', error);
      }
    }

    // Set up proactive token refresh
    const cleanup = setupTokenRefresh(() => {
      // When refresh fails, redirect to login page
      console.error('Token refresh failed, redirecting to login');
      window.location.href = '/auth?error=session_expired';
    });

    // Mark authentication as ready
    setIsAuthReady(true);

    // Cleanup function
    return cleanup;
  }, [searchParams]);

  // 等待认证状态就绪后再渲染子组件
  if (!isAuthReady) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <MorphingSquare message="Loading..." />
      </div>
    );
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}