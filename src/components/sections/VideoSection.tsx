import { VideoEmbed } from '../common/VideoEmbed.tsx'

const VIMEO_SRC = 'https://player.vimeo.com/video/1149336170?h=14a20a5802&badge=0&autopause=0&dnt=1'

export function VideoSection() {
  return (
    <section className="px-4 pb-[26px]">
      <div className="mx-auto w-full max-w-[720px]">
        <div className="blue-glow rounded-2xl p-[10px]">
          <VideoEmbed
            provider="vimeo"
            src={VIMEO_SRC}
            poster="/assets/landing/vsl-poster.jpg"
            title="Video de Trading Exponencial"
            className="rounded-xl"
          />
        </div>
      </div>
    </section>
  )
}
