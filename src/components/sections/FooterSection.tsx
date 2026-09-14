import { legalLinks } from '../../config/content.ts'

export function FooterSection() {
  return (
    <footer className="px-4 pb-16 pt-4">
      <nav className="page-narrow flex flex-col items-center gap-6 text-center sm:flex-row sm:justify-center sm:gap-16">
        {legalLinks.map((link) => (
          <a
            key={link.href}
            href={link.href}
            target="_blank"
            rel="noreferrer"
            className="text-[18px] font-bold text-white underline-offset-4 hover:underline"
          >
            {link.label}
          </a>
        ))}
      </nav>
    </footer>
  )
}
