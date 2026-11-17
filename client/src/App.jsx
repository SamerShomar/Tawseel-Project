import { useRef } from 'react'
import SplitText from '@/components/react-bits/SplitText/SplitText'
import { useLenis } from '@/hooks/useLenis'
import { gsap, useGSAP } from '@/lib/gsap'

function App() {
  useLenis()
  const sectionRef = useRef(null)

  useGSAP(
    () => {
      gsap.from('.card', {
        y: 60,
        opacity: 0,
        stagger: 0.15,
        scrollTrigger: { trigger: sectionRef.current, start: 'top 75%' },
      })
    },
    { scope: sectionRef },
  )

  return (
    <main>
      <section className="flex min-h-screen items-center justify-center px-4">
        <SplitText
          text="توصيل"
          tag="h1"
          splitType="words"
          className="text-6xl font-bold md:text-8xl"
          trigger="load"
        />
      </section>

      <section ref={sectionRef} className="mx-auto grid min-h-screen max-w-5xl gap-6 px-4 py-24 md:grid-cols-3">
        {['GSAP', 'Lenis', 'React Bits'].map((name) => (
          <div key={name} className="card rounded-2xl border border-neutral-800 bg-neutral-900 p-8 text-center text-2xl">
            {name}
          </div>
        ))}
      </section>
    </main>
  )
}

export default App
