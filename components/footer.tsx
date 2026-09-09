import Link from 'next/link'
import { Linkedin, Twitter, Facebook } from 'lucide-react'
import { AlaraLogo } from '@/components/alara-logo'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-secondary-dark text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-12">
          {/* Company Info */}
          <div>
            <div className="flex items-center mb-4">
              <AlaraLogo width={226} height={48} className="h-12 w-auto" forceVariant="dark" />
            </div>
            <p className="text-gray-300 text-sm">
              Intelligent school management platform by Vertex Blueprint Technology
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="font-semibold mb-4">Product</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>
                <Link href="#" className="hover:text-primary transition">
                  Features
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-primary transition">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/security" className="hover:text-primary transition">
                  Security
                </Link>
              </li>
              <li>
                <Link href="/support" className="hover:text-primary transition">
                  Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>
                <Link href="/about" className="hover:text-primary transition">
                  About
                </Link>
              </li>
              <li>
                <Link href="/careers" className="hover:text-primary transition">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-primary transition">
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold mb-4">Legal</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>
                <Link href="/privacy" className="hover:text-primary transition">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-primary transition">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/security" className="hover:text-primary transition">
                  Security
                </Link>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className="font-semibold mb-4">Follow</h3>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-300 hover:text-primary transition">
                <Linkedin size={20} />
              </a>
              <a href="#" className="text-gray-300 hover:text-primary transition">
                <Twitter size={20} />
              </a>
              <a href="#" className="text-gray-300 hover:text-primary transition">
                <Facebook size={20} />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-400">
              © {currentYear} Alara by Vertex Blueprint Technology. All rights reserved.
            </p>
            <p className="text-sm text-gray-400 mt-4 md:mt-0">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
