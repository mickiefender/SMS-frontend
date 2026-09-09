'use client'

import { useState } from 'react'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import {
  Mail,
  MessageCircle,
  Phone,
  BookOpen,
  LifeBuoy,
  GraduationCap,
  CreditCard,
  Wrench,
  Lock,
  CheckCircle2,
  ChevronDown,
} from 'lucide-react'

const helpCategories = [
  {
    icon: GraduationCap,
    title: 'Getting Started',
    description: 'Set up your school, add students and staff, and learn the basics of Alara.',
    topics: ['School setup & onboarding', 'Adding students and staff', 'Understanding your dashboard'],
  },
  {
    icon: CreditCard,
    title: 'Account & Billing',
    description: 'Manage your subscription, invoices, and fee collection settings.',
    topics: ['Subscription & plans', 'Billing & invoices', 'Fee configuration & collections'],
  },
  {
    icon: Wrench,
    title: 'Technical Issues',
    description: 'Troubleshoot login problems, loading issues, and platform errors.',
    topics: ['Login & password reset', 'Browser & device issues', 'Error messages & bugs'],
  },
  {
    icon: Lock,
    title: 'Data, Privacy & Security',
    description: 'Learn how we protect your data and how to manage access and permissions.',
    topics: ['Data security & encryption', 'Roles & permissions', 'Exporting or removing data'],
  },
]

const contactChannels = [
  {
    icon: Mail,
    title: 'Email Support',
    content: 'support@alara.school',
    subtext: 'Best for detailed questions and issues',
  },
  {
    icon: MessageCircle,
    title: 'Live Chat',
    content: 'Open during business hours',
    subtext: "Chat with a real person — no bots",
  },
  {
    icon: Phone,
    title: 'Phone Support',
    content: '+233 208 517 482',
    subtext: 'Available for plan holders',
  },
  {
    icon: BookOpen,
    title: 'Help Center',
    content: 'Browse our guides',
    subtext: 'Answers to common questions',
  },
]

const knowledgeBase = [
  {
    category: 'Getting Started',
    faqs: [
      {
        question: 'How do I set up my school on Alara?',
        answer: "Once your school account is created, an onboarding checklist walks you through the essentials: adding academic years, creating classes, enrolling students and staff, and configuring grading and attendance settings. Your assigned onboarding specialist can help with anything that's unclear.",
      },
      {
        question: 'Can I import my existing student data?',
        answer: "Yes. We support importing students and other records from common spreadsheet formats. During onboarding we'll help you prepare and map your data so it lands in the right place.",
      },
    ],
  },
  {
    category: 'Fees & Billing',
    faqs: [
      {
        question: 'How does fee collection work?',
        answer: "Alara lets you configure fee structures by class or term, issue invoices, and track payments. Payments are processed through a secure third-party provider, so card and other payment details are handled under their own security standards.",
      },
      {
        question: 'Can I change or cancel my subscription?',
        answer: "Yes — you can upgrade, downgrade, or cancel by contacting us. Unless otherwise agreed in writing, cancellation takes effect at the end of the current billing cycle.",
      },
    ],
  },
  {
    category: 'Technical',
    faqs: [
      {
        question: 'I can’t log in. What do I do?',
        answer: "First, try the “Forgot password” option to reset your credentials. If that doesn't work, contact your school administrator to confirm your account is active, or reach out to support and we'll help you get back in.",
      },
      {
        question: 'Which browsers are supported?',
        answer: "Alara works best in the latest versions of Chrome, Firefox, Safari, and Edge. Make sure your browser is up to date and that you aren't blocking essential cookies, which we need to keep you signed in.",
      },
    ],
  },
  {
    category: 'Data & Security',
    faqs: [
      {
        question: 'Is my school’s data safe?',
        answer: "We use encrypted connections (HTTPS/TLS) in transit and encryption at rest from our infrastructure providers. Access to school data is limited to authenticated accounts with role-based permissions.",
      },
      {
        question: 'How do I export or remove my data?',
        answer: "School administrators can request a data export or deletion at any time by contacting support. We'll work with your school to return or securely delete records within a reasonable period, subject to legal retention requirements.",
      },
    ],
  },
]

export default function SupportPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    school: '',
    topic: 'account',
    message: '',
  })
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Support request submitted:', formData)
    alert('Thank you! Your support request has been received. Our team will get back to you soon.')
    setFormData({ name: '', email: '', school: '', topic: 'account', message: '' })
  }

  return (
    <>
      <Header />
      <main>
        {/* Hero Section */}
        <section className="relative bg-gradient-to-b from-primary/10 to-transparent py-20 md:py-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 text-balance">
                We're Here to Help
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Find answers, get guidance, and reach a real person whenever you need support with Alara.
              </p>
            </div>
          </div>
        </section>

        {/* Help Categories */}
        <section className="py-20 md:py-32 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <p className="text-primary font-semibold text-sm mb-2">HELP TOPICS</p>
              <h2 className="text-3xl md:text-5xl font-bold text-foreground text-balance">
                How Can We Help You?
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {helpCategories.map((category, index) => {
                const Icon = category.icon
                return (
                  <div key={index} className="bg-muted p-8 rounded-lg hover:shadow-lg transition">
                    <div className="w-12 h-12 bg-primary text-white rounded-lg flex items-center justify-center mb-4">
                      <Icon size={24} />
                    </div>
                    <h3 className="font-bold text-lg text-foreground mb-2">{category.title}</h3>
                    <p className="text-muted-foreground text-sm mb-4">{category.description}</p>
                    <ul className="space-y-2">
                      {category.topics.map((topic, i) => (
                        <li key={i} className="flex gap-2 items-start">
                          <CheckCircle2 size={16} className="text-primary flex-shrink-0 mt-0.5" />
                          <span className="text-muted-foreground text-sm">{topic}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Contact Channels */}
        <section className="py-20 md:py-32 bg-muted">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <p className="text-primary font-semibold text-sm mb-2">CONTACT US</p>
              <h2 className="text-3xl md:text-5xl font-bold text-foreground text-balance">
                Reach the Support Team
              </h2>
              <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
                No ticket queues, no bots. Every request goes straight to a real person on our team.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
              {contactChannels.map((channel, index) => {
                const Icon = channel.icon
                return (
                  <div key={index} className="bg-card p-6 rounded-lg border border-border text-center hover:shadow-lg transition">
                    <div className="w-12 h-12 bg-primary/10 text-primary rounded-lg flex items-center justify-center mx-auto mb-4">
                      <Icon size={24} />
                    </div>
                    <h3 className="font-bold text-foreground mb-1">{channel.title}</h3>
                    <p className="font-semibold text-primary text-sm mb-1">{channel.content}</p>
                    <p className="text-muted-foreground text-xs">{channel.subtext}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Support Form & What to Expect */}
        <section id="support-form" className="py-20 md:py-32 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-12">
              {/* Support Form */}
              <div>
                <p className="text-primary font-semibold text-sm mb-2">SEND A REQUEST</p>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8">
                  Tell Us What's Going On
                </h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Your name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="your@email.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      School/Organization
                    </label>
                    <input
                      type="text"
                      name="school"
                      value={formData.school}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Your school name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      Topic
                    </label>
                    <select
                      name="topic"
                      value={formData.topic}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="account">Account & Billing</option>
                      <option value="technical">Technical Issue</option>
                      <option value="onboarding">Getting Started / Onboarding</option>
                      <option value="fees">Fees & Payments</option>
                      <option value="data">Data & Security</option>
                      <option value="other">Something Else</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      What can we help you with?
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      rows={5}
                      className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Describe your issue or question..."
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition font-semibold"
                  >
                    Submit Support Request
                  </button>
                </form>
              </div>

              {/* What to Expect */}
              <div>
                <p className="text-primary font-semibold text-sm mb-2">WHAT HAPPENS NEXT</p>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8">
                  After You Reach Out
                </h2>

                <div className="space-y-8">
                  {[
                    {
                      title: 'We read every request',
                      description: 'A real person reviews your message. We don\'t route requests into an automated ticket queue.',
                    },
                    {
                      title: 'A specialist responds quickly',
                      description: 'Most questions get a response within one business day. Critical issues are escalated immediately.',
                    },
                    {
                      title: 'We work it through with you',
                      description: 'We\'ll guide you through a fix, walk you through the relevant feature, or escalate to engineering if needed.',
                    },
                  ].map((step, index) => (
                    <div key={index} className="bg-card p-8 rounded-lg border border-border hover:shadow-lg transition">
                      <h3 className="font-bold text-lg text-foreground mb-3">{step.title}</h3>
                      <p className="text-muted-foreground">{step.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Knowledge Base / FAQ */}
        <section className="py-20 md:py-32 bg-muted">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <p className="text-primary font-semibold text-sm mb-2">KNOWLEDGE BASE</p>
              <h2 className="text-3xl md:text-5xl font-bold text-foreground text-balance">
                Frequently Asked Questions
              </h2>
            </div>

            <div className="space-y-8">
              {knowledgeBase.map((section, sectionIndex) => (
                <div key={sectionIndex}>
                  <h3 className="text-xl font-bold text-foreground mb-4">{section.category}</h3>
                  <div className="space-y-3">
                    {section.faqs.map((faq, faqIndex) => {
                      const globalIndex = sectionIndex * 10 + faqIndex
                      const isOpen = openFaq === globalIndex
                      return (
                        <div key={faqIndex} className="bg-card rounded-lg border border-border overflow-hidden">
                          <button
                            onClick={() => setOpenFaq(isOpen ? null : globalIndex)}
                            className="w-full flex items-center justify-between gap-4 p-5 text-left hover:bg-muted/50 transition"
                          >
                            <span className="font-semibold text-foreground">{faq.question}</span>
                            <ChevronDown
                              size={20}
                              className={`text-muted-foreground flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                            />
                          </button>
                          {isOpen && (
                            <div className="px-5 pb-5">
                              <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 md:py-32 bg-primary text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <LifeBuoy size={32} />
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Still Need a Hand?</h2>
            <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
              Our support team is here for you. Send us a request and we'll get back to you as soon as we can.
            </p>
            <a
              href="#support-form"
              className="inline-block bg-white text-primary px-8 py-3 rounded-lg hover:bg-gray-100 transition font-semibold"
            >
              Get Support
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
