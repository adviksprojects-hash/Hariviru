import 'dotenv/config';
import { db } from '../lib/prisma.js';

async function seed() {
  console.log('Seeding HaruViru Celebration House branches and slots...');

  const branch1 = await db.branch.upsert({
    where: { slug: 'haruviru-jubilee-hills' },
    update: {},
    create: {
      name: 'HaruViru Jubilee Hills',
      slug: 'haruviru-jubilee-hills',
      city: 'Hyderabad',
      state: 'Telangana',
      address: 'Plot 402, Road No 36, Jubilee Hills, Hyderabad',
      phone: '+91 98765 43210',
      email: 'jubilee@haruviru.com',
      description: 'Ultra-luxurious celebration house with ambient LED lighting, private movie screening setup, plush lounge seating, and custom birthday/anniversary decor themes.',
      images: [
        'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80'
      ],
      amenities: ['Private 4K Projector', 'Dolby Atmos Sound', 'AC Lounge', 'Theme Decoration', 'Cake & Snack Stand', 'Gaming Console'],
      pricePerSlot: 4999,
      isActive: true,
    }
  });

  const branch2 = await db.branch.upsert({
    where: { slug: 'haruviru-gachibowli' },
    update: {},
    create: {
      name: 'HaruViru Gachibowli',
      slug: 'haruviru-gachibowli',
      city: 'Hyderabad',
      state: 'Telangana',
      address: 'Level 3, Platinum Towers, Financial District, Gachibowli',
      phone: '+91 98765 43211',
      email: 'gachibowli@haruviru.com',
      description: 'Modern tech-integrated celebration arena designed for grand surprise parties, corporate celebrations, and intimate family get-togethers.',
      images: [
        'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80'
      ],
      amenities: ['Laser Lighting', 'PS5 Console', 'Custom Photo Booth', 'Rooftop Terrace Access', 'Buffet Counter'],
      pricePerSlot: 5499,
      isActive: true,
    }
  });

  const branch3 = await db.branch.upsert({
    where: { slug: 'haruviru-koramangala' },
    update: {},
    create: {
      name: 'HaruViru Koramangala',
      slug: 'haruviru-koramangala',
      city: 'Bengaluru',
      state: 'Karnataka',
      address: '80 Feet Road, 4th Block, Koramangala, Bengaluru',
      phone: '+91 98765 43212',
      email: 'koramangala@haruviru.com',
      description: 'Cozy yet vibrant private celebration house featuring fairy lights, karaoke system, customized photo walls, and gourmet catering options.',
      images: [
        'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80'
      ],
      amenities: ['Karaoke Setup', '4K Cinema Projection', 'Fairy Light Canopy', 'Private Dining Area', 'Complimentary Balloons'],
      pricePerSlot: 4499,
      isActive: true,
    }
  });

  // Create slots for each branch if not existing
  for (const branch of [branch1, branch2, branch3]) {
    const existingSlots = await db.slot.findMany({ where: { branchId: branch.id } });
    if (existingSlots.length === 0) {
      await db.slot.createMany({
        data: [
          { branchId: branch.id, title: 'Morning Celebration (9:00 AM - 1:00 PM)', startTime: '09:00', endTime: '13:00', price: branch.pricePerSlot },
          { branchId: branch.id, title: 'Afternoon Delight (2:00 PM - 6:00 PM)', startTime: '14:00', endTime: '18:00', price: branch.pricePerSlot },
          { branchId: branch.id, title: 'Night Grand Gala (7:00 PM - 11:00 PM)', startTime: '19:00', endTime: '23:00', price: branch.pricePerSlot * 1.15 },
        ]
      });
    }
  }

  console.log('Seeding completed successfully!');
}

seed()
  .catch((err) => {
    console.error('Seed error:', err);
    process.exit(1);
  });
