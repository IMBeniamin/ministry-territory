import { useRef, useEffect, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { SearchBox } from '@mapbox/search-js-react'
import { Paper } from '@mantine/core'
import { createFileRoute } from '@tanstack/react-router'
import './livemap.css'

export const Route = createFileRoute('/livemap')({
  component: MapRouteComponent,
})

const accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN

function MapRouteComponent() {

  const mapRef = useRef<mapboxgl.Map | null>(null)
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const [map, setMap] = useState<mapboxgl.Map | undefined>(undefined)
  const [inputValue, setInputValue] = useState('')

  useEffect(() => {
    mapboxgl.accessToken = accessToken

    if (!mapContainerRef.current) return

    const nextMap = new mapboxgl.Map({
      container: mapContainerRef.current,
      center: [10.3280, 44.8015],
      zoom: 13,
      attributionControl: false,
    })
    mapRef.current = nextMap
    setMap(nextMap)

    return () => {
      if (mapRef.current) mapRef.current.remove()
      mapRef.current = null
      setMap(undefined)
    }
  }, [])

  return (
    <div className="map-page">
      <Paper className="search-panel" shadow="md" radius="md" p="sm">
        <SearchBox
          accessToken={accessToken}
          map={map}
          mapboxgl={mapboxgl}
          value={inputValue}
          onChange={(d) => {
            setInputValue(d)
          }}
          marker
        />
      </Paper>
      <div id='map-container' ref={mapContainerRef} />
    </div>
    )
}
