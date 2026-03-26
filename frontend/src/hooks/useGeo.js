import { useState, useEffect, useCallback } from 'react'
import api from '../services/api'

export default function useGeo() {
  const [departamentos, setDepartamentos] = useState([])
  const [distritos, setDistritos] = useState([])
  const [ciudades, setCiudades] = useState([])
  const [barrios, setBarrios] = useState([])
  const [loadingGeo, setLoadingGeo] = useState(false)

  // Load departamentos on mount
  useEffect(() => {
    api.get('/geo/departamentos')
      .then((res) => setDepartamentos(res.data?.data || []))
      .catch(() => setDepartamentos([]))
  }, [])

  const fetchDistritos = useCallback(async (departamentoId) => {
    setDistritos([])
    setCiudades([])
    setBarrios([])
    if (!departamentoId) return
    setLoadingGeo(true)
    try {
      const res = await api.get(`/geo/departamentos/${departamentoId}/distritos`)
      setDistritos(res.data?.data || [])
    } catch {
      setDistritos([])
    } finally {
      setLoadingGeo(false)
    }
  }, [])

  const fetchCiudades = useCallback(async (departamentoId, distritoId) => {
    setCiudades([])
    setBarrios([])
    if (!departamentoId || !distritoId) return
    setLoadingGeo(true)
    try {
      const res = await api.get(`/geo/departamentos/${departamentoId}/distritos/${distritoId}/ciudades`)
      setCiudades(res.data?.data || [])
    } catch {
      setCiudades([])
    } finally {
      setLoadingGeo(false)
    }
  }, [])

  const fetchBarrios = useCallback(async (departamentoId, distritoId, ciudadId) => {
    setBarrios([])
    if (!departamentoId || !distritoId || !ciudadId) return
    setLoadingGeo(true)
    try {
      const res = await api.get(`/geo/departamentos/${departamentoId}/distritos/${distritoId}/ciudades/${ciudadId}/barrios`)
      setBarrios(res.data?.data || [])
    } catch {
      setBarrios([])
    } finally {
      setLoadingGeo(false)
    }
  }, [])

  return {
    departamentos,
    distritos,
    ciudades,
    barrios,
    loadingGeo,
    fetchDistritos,
    fetchCiudades,
    fetchBarrios,
  }
}
