import 'dotenv/config';
import { db } from '../lib/prisma.js';

async function seed() {
  console.log('Seeding HaruViru Celebration House branches with contact channels & maps...');

  const branch1 = await db.branch.upsert({
    where: { slug: 'haruviru-jubilee-hills' },
    update: {
      mapUrl: 'https://maps.google.com/?q=Jubilee+Hills+Road+36+Hyderabad',
      instagramHandle: 'celebration_house_23',
      whatsapp: '9762486649',
    },
    create: {
      name: 'HaruViru Jubilee Hills',
      slug: 'haruviru-jubilee-hills',
      city: 'Hyderabad',
      state: 'Telangana',
      address: 'Plot 402, Road No 36, Jubilee Hills, Hyderabad',
      phone: '+91 97624 86649',
      email: 'jubilee@haruviru.com',
      description: 'Ultra-luxurious celebration house with ambient LED lighting, private movie screening setup, plush lounge seating, and custom birthday/anniversary decor themes.',
      images: [
        'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80'
      ],
      amenities: ['Private 4K Projector', 'Dolby Atmos Sound', 'AC Hall', 'Flower & Balloon Decor', 'Celebration Cake', 'Smoke & Bubble Entry'],
      pricePerSlot: 1499,
      mapUrl: 'https://maps.google.com/?q=Jubilee+Hills+Road+36+Hyderabad',
      instagramHandle: 'celebration_house_23',
      whatsapp: '9762486649',
      isActive: true,
    }
  });

  const branch2 = await db.branch.upsert({
    where: { slug: 'haruviru-gachibowli' },
    update: {
      mapUrl: 'https://maps.google.com/?q=Financial+District+Gachibowli+Hyderabad',
      instagramHandle: 'celebration_house_23',
      whatsapp: '9762486649',
    },
    create: {
      name: 'HaruViru Gachibowli',
      slug: 'haruviru-gachibowli',
      city: 'Hyderabad',
      state: 'Telangana',
      address: 'Level 3, Platinum Towers, Financial District, Gachibowli',
      phone: '+91 97624 86649',
      email: 'gachibowli@haruviru.com',
      description: 'Modern tech-integrated celebration arena designed for grand surprise parties, corporate celebrations, and intimate family get-togethers.',
      images: [
        'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80'
      ],
      amenities: ['Laser Lighting', 'PS5 Console', 'Custom Photo Booth', 'Cold Fire Gun', 'Burger & Drinks'],
      pricePerSlot: 1499,
      mapUrl: 'https://maps.google.com/?q=Financial+District+Gachibowli+Hyderabad',
      instagramHandle: 'celebration_house_23',
      whatsapp: '9762486649',
      isActive: true,
    }
  });

  const branch3 = await db.branch.upsert({
    where: { slug: 'haruviru-koramangala' },
    update: {
      mapUrl: 'https://maps.google.com/?q=Koramangala+4th+Block+Bengaluru',
      instagramHandle: 'celebration_house_23',
      whatsapp: '9762486649',
    },
    create: {
      name: 'HaruViru Koramangala',
      slug: 'haruviru-koramangala',
      city: 'Bengaluru',
      state: 'Karnataka',
      address: '80 Feet Road, 4th Block, Koramangala, Bengaluru',
      phone: '+91 97624 86649',
      email: 'koramangala@haruviru.com',
      description: 'Cozy yet vibrant private celebration house featuring fairy lights, karaoke system, customized photo walls, and gourmet catering options.',
      images: [
        'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80'
      ],
      amenities: ['Karaoke Setup', '4K Cinema Projection', 'Fairy Light Canopy', 'Private Dining Area', 'Complimentary Balloons'],
      pricePerSlot: 1499,
      mapUrl: 'https://maps.google.com/?q=Koramangala+4th+Block+Bengaluru',
      instagramHandle: 'celebration_house_23',
      whatsapp: '9762486649',
      isActive: true,
    }
  });

  console.log('Seeding completed successfully!');
}

seed()
  .catch((err) => {
    console.error('Seed error:', err);
    process.exit(1);
  });
