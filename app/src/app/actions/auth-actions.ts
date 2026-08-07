'use server';

import { cookies } from 'next/headers';
import { signToken } from '@/lib/auth';

export async function login(formData: FormData) {
  try {
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    const validUsername = process.env.ADMIN_USER || 'admin';
    const validPassword = process.env.ADMIN_PASS || 'admin123';

    if (username === validUsername && password === validPassword) {
      const token = await signToken({ username, role: 'admin' });
      
      // Set HTTP-only cookie
      const cookieStore = await cookies();
      cookieStore.set({
        name: 'auth_token',
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });

      return { success: true };
    }

    return { success: false, error: 'Tên đăng nhập hoặc mật khẩu không đúng' };
  } catch (error: any) {
    console.error('Error during login action:', error);
    return { success: false, error: 'Lỗi xác thực hệ thống: ' + (error.message || 'Unknown error') };
  }
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete('auth_token');
}
