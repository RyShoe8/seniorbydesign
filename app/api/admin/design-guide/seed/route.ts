import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getDesignGuideContentCollection } from '@/lib/db';
import type { DesignGuideContent } from '@/lib/design-guide-models';

/**
 * POST /api/admin/design-guide/seed
 * Seeds the design guide with initial content derived from the existing site data.
 * Only runs if no document exists yet. Admin-only.
 */
export async function POST() {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const col = await getDesignGuideContentCollection();
    const existing = await col.findOne({});
    if (existing) {
      return NextResponse.json({ message: 'Content already exists. Use the admin panel to edit.' });
    }

    const seed: Omit<DesignGuideContent, '_id'> = {
      hero: {
        headline: 'Designing Spaces\nThat Honor Every Stage of Life',
        subheadline: 'Senior By Design transforms senior living communities into warm, functional, and beautifully crafted environments where residents thrive.',
        backgroundImage: {
          src: '/images/senior-living-team-hero-design-sbd.jpg',
          alt: 'Senior By Design team collaborating on a senior living interior design project',
        },
        ctaPrimary: { label: 'Schedule a Consultation', href: '/contact' },
        ctaSecondary: { label: 'Download Our Guide', href: '/files/SBD Interactive Brochure.pdf' },
      },

      intro: {
        headline: 'A Boutique Firm With National Reach',
        body: 'Senior By Design is a Dallas-based boutique senior living interior design firm founded by Reid Bonner. We provide interior design, FF&E procurement, space planning, and turnkey installation for independent living, assisted living, memory care, and active adult communities across the United States. Our 35,000-square-foot design center and warehouse allows us to manage every detail from concept to completion.',
        stats: [
          { value: '25', label: 'Years of Experience', suffix: '+' },
          { value: '500', label: 'Projects Completed', suffix: '+' },
          { value: '98', label: 'Client Satisfaction', suffix: '%' },
          { value: '35000', label: 'Sq Ft Design Center', suffix: '' },
        ],
        cards: [
          {
            icon: '🏗️',
            title: 'Turnkey Solutions',
            description: 'From initial concept through final installation, we manage every detail of your senior living interior project.',
          },
          {
            icon: '🎨',
            title: 'Award-Winning Design',
            description: 'Our team creates spaces that are both beautiful and purposeful, enhancing the lives of every resident.',
          },
          {
            icon: '🤝',
            title: 'Trusted Partner',
            description: 'We work alongside operators, developers, and owners as a true extension of their team.',
          },
          {
            icon: '📦',
            title: '35,000 Sq Ft Warehouse',
            description: 'Our Dallas design center handles procurement, staging, and quality control under one roof.',
            image: {
              src: '/images/senior-living-warehouse-design-sbd-2.webp',
              alt: 'Senior By Design 35000 square foot warehouse and design center',
            },
          },
        ],
      },

      whyUs: {
        headline: 'Why Senior By Design',
        subheadline: 'We bring a unique combination of design expertise, industry knowledge, and genuine care to every project.',
        cards: [
          { icon: '✨', title: 'Boutique Attention', description: 'Every project receives personalized care from our senior design team—never passed off to junior staff.' },
          { icon: '🛋️', title: 'We Test Everything', description: 'Our team personally sits in every chair and tests every piece of furniture for comfort, durability, and safety.' },
          { icon: '📐', title: 'End-to-End Service', description: 'Design, procurement, warehousing, and installation—all managed under one roof for seamless delivery.' },
          { icon: '🏠', title: 'Senior Living Specialists', description: 'We focus exclusively on senior living environments, understanding the unique needs of residents and operators.' },
          { icon: '🌍', title: 'Nationwide Reach', description: 'Based in Dallas with projects across the United States. Our logistics infrastructure supports communities everywhere.' },
          { icon: '💎', title: 'Luxury Craftsmanship', description: 'We believe senior living communities deserve the same design excellence as the finest hospitality projects.' },
        ],
      },

      services: {
        headline: 'Our Services',
        subheadline: 'Comprehensive interior design and FF&E solutions for senior living communities.',
        items: [
          {
            title: 'Interior Environments & Design',
            description: 'Complete interior design services including space planning, finish selection, furniture specification, and construction documentation.',
            image: { src: '/images/senior-living-services-hero-design-sbd.jpg', alt: 'Senior living interior design services showcase' },
            details: 'We create environments that promote comfort, safety, and well-being. Our design process considers every aspect of the resident experience—from color psychology and lighting design to wayfinding and accessibility. Each space is thoughtfully planned to support both independence and community.',
            order: 1,
          },
          {
            title: 'FF&E Services',
            description: 'Furniture, fixtures, and equipment sourcing and specification with our signature hands-on testing approach.',
            image: { src: '/images/senior-living-firm-culture-design-sbd.webp', alt: 'FF&E selection and testing process' },
            details: 'Every piece of furniture is personally evaluated by our team for comfort, durability, and suitability for senior living environments. We source from trusted commercial-grade manufacturers and negotiate competitive pricing on behalf of our clients.',
            order: 2,
          },
          {
            title: 'Procurement & Installation',
            description: 'End-to-end procurement, warehousing at our 35,000 sq ft design center, and professional on-site installation.',
            image: { src: '/images/senior-living-warehouse-design-sbd-3.webp', alt: 'Procurement warehousing and installation services' },
            details: 'Our Dallas design center provides secure warehousing, quality inspection, and staging before installation. Our experienced installation teams ensure every piece is placed perfectly, with careful attention to resident comfort and safety.',
            order: 3,
          },
          {
            title: 'Overall Design & Development',
            description: 'Turnkey project management coordinating owners, architects, and contractors from concept to completion.',
            image: { src: '/images/senior-living-warehouse-design-sbd-4.webp', alt: 'Design and development project management' },
            details: 'We serve as the single point of contact for all interior design and FF&E needs, coordinating with architects, contractors, and ownership groups to deliver projects on time and on budget. Our collaborative approach ensures every stakeholder is aligned throughout the process.',
            order: 4,
          },
        ],
      },

      agingInPlace: {
        headline: 'Designing for Life',
        body: 'Every design decision we make is guided by a single principle: enhancing the quality of life for seniors. We create spaces that promote independence, safety, and dignity—environments where residents feel truly at home. Our designs consider the full spectrum of aging, from active adult lifestyles to memory care needs.',
        image: {
          src: '/images/senior-living-portfolio-index-design-sbd.jpg',
          alt: 'Senior living community designed for comfort and independence',
        },
        stats: [
          { value: '10000', label: 'Baby Boomers Turning 65 Daily' },
          { value: '70', label: 'Of Seniors Will Need Long-Term Care', suffix: '%' },
          { value: '90', label: 'Want to Stay in Community Settings', suffix: '%' },
        ],
        features: [
          { icon: '🔒', title: 'Safety First', description: 'ADA-compliant designs with slip-resistant materials, proper lighting, and intuitive wayfinding throughout.' },
          { icon: '🏡', title: 'Home-Like Feel', description: 'Residential-inspired aesthetics that reduce institutional feel while maintaining commercial durability.' },
          { icon: '🧠', title: 'Memory Care Design', description: 'Evidence-based design principles for memory care including color coding, visual cues, and calming environments.' },
          { icon: '♿', title: 'Universal Design', description: 'Spaces designed to be accessible and comfortable for all abilities, promoting independence at every stage.' },
        ],
      },

      process: {
        headline: 'Our Process',
        subheadline: 'A proven approach refined over 25 years of senior living design excellence.',
        steps: [
          { phase: '01', title: 'Consultation', description: 'We begin with a thorough understanding of your vision, budget, timeline, and the unique needs of your community.', icon: '💬' },
          { phase: '02', title: 'Planning', description: 'Our team develops comprehensive space plans, mood boards, and preliminary specifications tailored to your project.', icon: '📋' },
          { phase: '03', title: 'Design', description: 'Detailed interior designs are created including finish selections, furniture specifications, and construction documentation.', icon: '🎨' },
          { phase: '04', title: 'Procurement', description: 'We source, order, and manage all FF&E through our Dallas design center with rigorous quality control.', icon: '📦' },
          { phase: '05', title: 'Installation', description: 'Our professional teams handle delivery, placement, and setup—transforming spaces with precision and care.', icon: '🔧' },
          { phase: '06', title: 'Follow-Up', description: 'We stand behind our work with post-installation support, warranty coordination, and ongoing design partnership.', icon: '✅' },
        ],
      },

      portfolio: {
        headline: 'Our Work',
        subheadline: 'Explore our portfolio of senior living communities transformed by thoughtful, resident-centered design.',
        useExistingPortfolio: true,
        images: [],
      },

      testimonials: {
        headline: 'Words From Our Clients',
        subheadline: 'Hear from operators and developers who trust Senior By Design with their communities.',
        useExistingTestimonials: true,
        items: [],
      },

      financing: {
        headline: 'Investment in Excellence',
        body: 'We work with every budget to deliver outstanding design solutions. Our procurement scale and vendor relationships allow us to offer competitive pricing without compromising on quality. Contact us for a personalized project estimate.',
        examples: [
          { label: 'Model Unit Refresh', value: 'Starting at $25,000' },
          { label: 'Common Area Renovation', value: 'Starting at $75,000' },
          { label: 'Full Community Design', value: 'Custom Pricing' },
        ],
      },

      faq: {
        headline: 'Frequently Asked Questions',
        items: [
          { question: 'What areas do you serve?', answer: 'Senior By Design serves clients nationwide from our Dallas headquarters. Our logistics infrastructure and experienced teams can support projects in any state.' },
          { question: 'How long does a typical project take?', answer: 'Project timelines vary based on scope. A model unit refresh can be completed in 6-8 weeks, while a full community design typically takes 4-6 months from concept to installation.' },
          { question: 'Do you work with existing furniture?', answer: 'Absolutely. We can incorporate existing pieces into new designs, recommend selective replacements, or provide complete turnkey solutions based on your needs and budget.' },
          { question: 'What makes your FF&E process unique?', answer: 'Our team personally tests every piece of seating for comfort and durability. We also manage procurement, warehousing, and quality control from our 35,000 sq ft Dallas design center.' },
          { question: 'Can you work within our budget?', answer: 'Yes. We pride ourselves on delivering exceptional design at every price point. Our vendor relationships and buying power help maximize your investment.' },
        ],
      },

      cta: {
        headline: 'Let\'s Create Something Beautiful Together',
        subheadline: 'Schedule a consultation to discuss your next senior living project. Our team is ready to bring your vision to life.',
        phone: '(833) 773-3744',
        email: 'info@seniorbydesign.com',
        showConsultationForm: true,
        backgroundImage: {
          src: '/images/senior-living-firm-hero-design-sbd.webp',
          alt: 'Senior By Design Dallas headquarters',
        },
      },

      updatedAt: new Date(),
    };

    await col.insertOne(seed as DesignGuideContent);
    return NextResponse.json({ success: true, message: 'Design guide content seeded successfully.' });
  } catch (error) {
    console.error('Error seeding design guide content:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
