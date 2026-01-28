import Cookies from 'js-cookie';

// Utility functions for authentication
export const setAuthTokens = (token: string, user: any) => {
  if (typeof window !== 'undefined') {
    // Simpan di localStorage
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    // Simpan di cookies untuk middleware - DUA CARA
    Cookies.set('token', token, { expires: 7, path: '/' });
    Cookies.set('user', JSON.stringify(user), { expires: 7, path: '/' });
    
    // Juga set cookie langsung untuk memastikan middleware bisa baca
    document.cookie = `token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
    document.cookie = `user=${encodeURIComponent(JSON.stringify(user))}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
    
    console.log('✅ Auth tokens set in localStorage and cookies');
    console.log('User role stored:', user.role);
  }
};

export const getCurrentUser = () => {
  if (typeof window !== 'undefined') {
    // Coba dulu dari cookies, kemudian localStorage
    const userFromCookie = Cookies.get('user');
    if (userFromCookie) {
      try {
        return JSON.parse(userFromCookie);
      } catch (error) {
        console.error('Error parsing user from cookie:', error);
      }
    }
    
    // Fallback ke localStorage
    const userFromLocal = localStorage.getItem('user');
    if (userFromLocal) {
      try {
        return JSON.parse(userFromLocal);
      } catch (error) {
        console.error('Error parsing user from localStorage:', error);
      }
    }
  }
  return null;
};

export const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    // Coba dulu dari cookies, kemudian localStorage
    return Cookies.get('token') || localStorage.getItem('token');
  }
  return null;
};

export const logout = () => {
  if (typeof window !== 'undefined') {
    // Hapus dari localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Hapus cookies
    Cookies.remove('token', { path: '/' });
    Cookies.remove('user', { path: '/' });
    
    window.location.href = '/';
  }
};

export const isAuthenticated = () => {
  if (typeof window !== 'undefined') {
    return !!(Cookies.get('token') || localStorage.getItem('token'));
  }
  return false;
};

export const hasRole = (allowedRoles: string[]) => {
  const user = getCurrentUser();
  return user && allowedRoles.includes(user.role);
};