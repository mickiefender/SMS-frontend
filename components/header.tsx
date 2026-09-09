'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { AlaraLogo } from '@/components/alara-logo'

export function Header() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <AlaraLogo width={226} height={48} className="h-12 w-auto" priority />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="block text-foreground hover:text-primary">
              Home
            </Link>
            <Link href="/about" className="text-foreground hover:text-primary transition">
              About
            </Link>
            <Link href="/blog" className="text-foreground hover:text-primary transition">
              Blog
            </Link>
            <Link href="/careers" className="text-foreground hover:text-primary transition">
              Careers
            </Link>
            <Link href="/join-team" className="text-foreground hover:text-primary transition">
              Join Team
            </Link>
            <Link href="/contact" className="text-foreground hover:text-primary transition">
              Contact
            </Link>
            <Link href="/support" className="text-foreground hover:text-primary transition">
              Support
            </Link>
          </div>

          {/* CTA Button */}
          <div className="hidden md:block">
            <Link
              href="/contact"
              className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 transition font-medium"
            >
              Schedule Demo
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-foreground"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden mt-4 space-y-4 pb-4">
            <Link href="/" className="block text-foreground hover:text-primary">
              Home
            </Link>
            <Link href="/about" className="block text-foreground hover:text-primary">
              About
            </Link>
            <Link href="/blog" className="block text-foreground hover:text-primary">
              Blog
            </Link>
            <Link href="/careers" className="block text-foreground hover:text-primary">
              Careers
            </Link>
            <Link href="/join-team" className="block text-foreground hover:text-primary">
              Join Team
            </Link>
            <Link href="/contact" className="block text-foreground hover:text-primary">
              Contact
            </Link>
            <Link href="/support" className="block text-foreground hover:text-primary">
              Support
            </Link>
            <Link
              href="/contact"
              onClick={() => setIsOpen(false)}
              className="block text-center w-full bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition font-medium"
            >
              Schedule Demo
            </Link>
          </div>
        )}
      </nav>
    </header>
  )
}
