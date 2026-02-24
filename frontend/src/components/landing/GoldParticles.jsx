export default function GoldParticles() {
  return (
    <div className="particles-container">
      {Array.from({ length: 15 }, (_, i) => (
        <div key={i} className="particle" />
      ))}
    </div>
  )
}
