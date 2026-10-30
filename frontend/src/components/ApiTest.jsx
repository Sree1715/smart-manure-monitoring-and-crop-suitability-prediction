import { useEffect, useState } from 'react'
import api from '../services/api'

export default function ApiTest() {
  const [message, setMessage] = useState('Connecting...')
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/status')
      .then((response) => {
        setMessage(response.data.message)
      })
      .catch((err) => {
        console.error(err)
        setError('Could not connect to FastAPI')
      })
  }, [])

  return (
    <div>
      {error ? (
        <p>{error}</p>
      ) : (
        <p>{message}</p>
      )}
    </div>
  )
}