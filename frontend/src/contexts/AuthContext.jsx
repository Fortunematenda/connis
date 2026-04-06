import { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(() => {
    const stored = localStorage.getItem('connis_admin');
    return stored ? JSON.parse(stored) : null;
  });
  const [company, setCompany] = useState(() => {
    const stored = localStorage.getItem('connis_company');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('connis_token');
    if (token) {
      authApi.getMe()
        .then((res) => {
          const d = res.data;
          setAdmin({ id: d.id, email: d.email, full_name: d.full_name, role: d.role });
          setCompany({ id: d.company_id, name: d.company_name, subscription_status: d.subscription_status, subscription_plan: d.subscription_plan, expires_at: d.expires_at });
        })
        .catch(() => {
          logout();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = (data) => {
    localStorage.setItem('connis_token', data.token);
    localStorage.setItem('connis_admin', JSON.stringify(data.admin));
    localStorage.setItem('connis_company', JSON.stringify(data.company));
    setAdmin(data.admin);
    setCompany(data.company);
  };

  const logout = () => {
    localStorage.removeItem('connis_token');
    localStorage.removeItem('connis_admin');
    localStorage.removeItem('connis_company');
    setAdmin(null);
    setCompany(null);
  };

  const isAuthenticated = !!admin;

  return (
    <AuthContext.Provider value={{ admin, company, login, logout, isAuthenticated, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
