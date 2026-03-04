import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="main" style={{ textAlign: 'center', padding: '2rem' }}>
      <h1>Page not found</h1>
      <p style={{ marginTop: '0.5rem' }}>
        <Link href="/">Return home</Link>
      </p>
    </div>
  )
}
