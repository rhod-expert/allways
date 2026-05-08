import { useContext } from 'react'
import { ClientAuthContext } from '../context/ClientAuthContext'

export default function useClientAuth() {
  const ctx = useContext(ClientAuthContext)
  if (!ctx) throw new Error('useClientAuth debe usarse dentro de un ClientAuthProvider')
  return ctx
}
