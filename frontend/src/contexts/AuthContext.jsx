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

  const refreshCompany = async () => {
    try {
      const res = await authApi.getMe();
      const d = res.data;
      setAdmin({ id: d.id, email: d.email, full_name: d.full_name, role: d.role });
      const c = {
        id: d.company_id, name: d.company_name,
        email: d.company_email, phone: d.company_phone,
        address: d.company_address, bank_details: d.bank_details,
        subscription_status: d.subscription_status,
        subscription_plan: d.subscription_plan,
        expires_at: d.expires_at,
      };
      setCompany(c);
      localStorage.setItem('connis_company', JSON.stringify(c));
      localStorage.setItem('connis_admin', JSON.stringify({ id: d.id, email: d.email, full_name: d.full_name, role: d.role }));
    } catch { /* ignore */ }
  };

  useEffect(() => {
    const token = localStorage.getItem('connis_token');
    if (token) {
      refreshCompany().catch(() => logout()).finally(() => setLoading(false));
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
    <AuthContext.Provider value={{ admin, company, login, logout, isAuthenticated, loading, refreshCompany }}>
      {children}
    </AuthContext.Provider>
  );
};
