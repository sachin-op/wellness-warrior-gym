import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser]   = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [role, setRole]   = useState(localStorage.getItem('role'))

  const login = (userData, accessToken, userRole, agreedToRules) => {
    setUser(userData)
    setToken(accessToken)
    setRole(userRole)
    localStorage.setItem('token',           accessToken)
    localStorage.setItem('role',            userRole)
    localStorage.setItem('agreed_to_rules', agreedToRules ? 'true' : 'false')
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    setRole(null)
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    localStorage.removeItem('agreed_to_rules')
  }

  return (
    <AuthContext.Provider value={{ user, token, role, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}