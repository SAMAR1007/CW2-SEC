import mongoose from 'mongoose';
import { UserModel } from './models/user.model';
import { HostProfileModel } from './models/hostProfile.model';
import { AccommodationModel } from './models/accommodation.model';
import { ExperienceModel } from './models/experience.model';

export async function seedHarry() {
  try {
    const user = await UserModel.findOne({ email: 'harry@gmail.com' });
    if (!user) {
      console.log('Seed: user harry@gmail.com not found');
      return;
    }

    const hostProfile = await HostProfileModel.findOne({ userId: user._id });
    if (!hostProfile) {
      console.log('Seed: HostProfile for harry@gmail.com not found');
      return;
    }

    const hostId = hostProfile._id;

    console.log('Seed: Clearing ALL stays and experiences for a fresh start...');
    await AccommodationModel.deleteMany({});
    await ExperienceModel.deleteMany({});

    console.log('Seed: Seeding 8 stays and 8 experiences for harry@gmail.com with 100% reliable image links...');

    const accommodations = [
      {
        hostId,
        title: "Tranquil Mountain Lodge with Panoramic Views",
        location: "Pokhara, Nepal",
        price: 4500,
        weekendPrice: 5000,
        description: "Escape to this beautiful lodge in Pokhara. Enjoy stunning sunrises over the Himalayas right from your bed.",
        highlights: ["Mountain View", "Peaceful", "Traditional Design"],
        amenities: ["Wifi", "Kitchen", "Free parking"],
        images: [
          "https://loremflickr.com/1000/600/lodge,mountain?lock=1",
          "https://loremflickr.com/1000/600/lodge,mountain?lock=2",
          "https://loremflickr.com/1000/600/lodge,mountain?lock=3",
          "https://loremflickr.com/1000/600/lodge,mountain?lock=4",
          "https://loremflickr.com/1000/600/lodge,mountain?lock=5"
        ],
        maxGuests: 4, bedrooms: 2, beds: 2, bathrooms: 1, isPublished: true,
      },
      {
        hostId,
        title: "Heritage Boutique Stay in Patan",
        location: "Kathmandu, Nepal",
        price: 3200,
        description: "Stay in a beautifully restored Newari building in the heart of Patan. Walking distance to Durbar Square.",
        highlights: ["Heritage Building", "City Center"],
        amenities: ["Wifi", "Breakfast included", "Dedicated workspace"],
        images: [
          "https://loremflickr.com/1000/600/heritage,room?lock=6",
          "https://loremflickr.com/1000/600/heritage,room?lock=7",
          "https://loremflickr.com/1000/600/heritage,room?lock=8",
          "https://loremflickr.com/1000/600/heritage,room?lock=9",
          "https://loremflickr.com/1000/600/heritage,room?lock=10"
        ],
        maxGuests: 2, bedrooms: 1, beds: 1, bathrooms: 1, isPublished: true,
      },
      {
        hostId,
        title: "Jungle Safari Resort Treehouse",
        location: "Chitwan, Nepal",
        price: 6000,
        description: "Immerse yourself in nature at our Eco-Resort treehouse on the edge of Chitwan National Park.",
        highlights: ["Treehouse", "Wildlife", "Eco-friendly"],
        amenities: ["Wifi", "Pool", "Restaurant"],
        images: [
          "https://loremflickr.com/1000/600/treehouse,jungle?lock=11",
          "https://loremflickr.com/1000/600/treehouse,jungle?lock=12",
          "https://loremflickr.com/1000/600/treehouse,jungle?lock=13",
          "https://loremflickr.com/1000/600/treehouse,jungle?lock=14",
          "https://loremflickr.com/1000/600/treehouse,jungle?lock=15"
        ],
        maxGuests: 3, bedrooms: 1, beds: 2, bathrooms: 1, isPublished: true,
      },
      {
        hostId,
        title: "Lakeside Retreat Villa",
        location: "Pokhara, Nepal",
        price: 8500,
        description: "A gorgeous private villa sitting right on the banks of Phewa Lake.",
        highlights: ["Lake Access", "Private", "Luxury"],
        amenities: ["Wifi", "Kitchen", "Free parking", "Pool"],
        images: [
          "https://loremflickr.com/1000/600/villa,lake?lock=16",
          "https://loremflickr.com/1000/600/villa,lake?lock=17",
          "https://loremflickr.com/1000/600/villa,lake?lock=18",
          "https://loremflickr.com/1000/600/villa,lake?lock=19",
          "https://loremflickr.com/1000/600/villa,lake?lock=20"
        ],
        maxGuests: 6, bedrooms: 3, beds: 3, bathrooms: 2, isPublished: true,
      },
      {
        hostId,
        title: "Traditional Newari Courtyard Home",
        location: "Bhaktapur, Nepal",
        price: 2500,
        description: "Experience the history of Bhaktapur living inside an authentic Newari courtyard.",
        highlights: ["Historic", "Culture", "Courtyard"],
        amenities: ["Wifi", "Kitchen", "Patio"],
        images: [
          "https://loremflickr.com/1000/600/courtyard,nepal?lock=21",
          "https://loremflickr.com/1000/600/courtyard,nepal?lock=22",
          "https://loremflickr.com/1000/600/courtyard,nepal?lock=23",
          "https://loremflickr.com/1000/600/courtyard,nepal?lock=24",
          "https://loremflickr.com/1000/600/courtyard,nepal?lock=25"
        ],
        maxGuests: 3, bedrooms: 2, beds: 2, bathrooms: 1, isPublished: true,
      },
      {
        hostId,
        title: "Everest View Tea House",
        location: "Namche Bazaar, Nepal",
        price: 1500,
        description: "Cozy rooms at 3,440m altitude with direct views of Mt. Everest.",
        highlights: ["Mountain View", "Trekking", "Cozy"],
        amenities: ["Breakfast included", "Heating", "Restaurant"],
        images: [
          "https://loremflickr.com/1000/600/teahouse,mountain?lock=26",
          "https://loremflickr.com/1000/600/teahouse,mountain?lock=27",
          "https://loremflickr.com/1000/600/teahouse,mountain?lock=28",
          "https://loremflickr.com/1000/600/teahouse,mountain?lock=29",
          "https://loremflickr.com/1000/600/teahouse,mountain?lock=30"
        ],
        maxGuests: 2, bedrooms: 1, beds: 2, bathrooms: 1, isPublished: true,
      },
      {
        hostId,
        title: "Luxury Modern Penthouse",
        location: "Kathmandu, Nepal",
        price: 12000,
        description: "Luxury penthouse with 360 views of the Kathmandu Valley.",
        highlights: ["Luxury", "City View", "Private Elevator"],
        amenities: ["Wifi", "Air conditioning", "Dedicated workspace"],
        images: [
          "https://loremflickr.com/1000/600/penthouse,interior?lock=31",
          "https://loremflickr.com/1000/600/penthouse,interior?lock=32",
          "https://loremflickr.com/1000/600/penthouse,interior?lock=33",
          "https://loremflickr.com/1000/600/penthouse,interior?lock=34",
          "https://loremflickr.com/1000/600/penthouse,interior?lock=35"
        ],
        maxGuests: 4, bedrooms: 2, beds: 2, bathrooms: 2, isPublished: true,
      },
      {
        hostId,
        title: "Eco-friendly Bamboo Cabin",
        location: "Nagarkot, Nepal",
        price: 3500,
        description: "Sustainable living amidst the pine forests with stunning sunrise views.",
        highlights: ["Eco-friendly", "Sunrise", "Forest"],
        amenities: ["Wifi", "Free parking", "Breakfast included"],
        images: [
          "https://loremflickr.com/1000/600/farmhouse,nature?lock=36",
          "https://loremflickr.com/1000/600/farmhouse,nature?lock=37",
          "https://loremflickr.com/1000/600/farmhouse,nature?lock=38",
          "https://loremflickr.com/1000/600/farmhouse,nature?lock=39",
          "https://loremflickr.com/1000/600/farmhouse,nature?lock=40"
        ],
        maxGuests: 2, bedrooms: 1, beds: 1, bathrooms: 1, isPublished: true,
      }
    ];

    await AccommodationModel.insertMany(accommodations);

    const experiences = [
      {
        hostId,
        title: "Private Momo Cooking Masterclass",
        category: "Food & Drink",
        price: 1500,
        description: "Learn the secrets of making the perfect authentic Nepali momos.",
        location: "Kathmandu, Nepal",
        images: [
          "https://loremflickr.com/1000/600/momo,food?lock=41",
          "https://loremflickr.com/1000/600/momo,food?lock=42",
          "https://loremflickr.com/1000/600/momo,food?lock=43",
          "https://loremflickr.com/1000/600/momo,food?lock=44",
          "https://loremflickr.com/1000/600/momo,food?lock=45"
        ],
        duration: "3 hours", yearsOfExperience: 5, maxGuests: 6, isPublished: true,
      },
      {
        hostId,
        title: "Sunrise Yoga in the Himalayas",
        category: "Wellness",
        price: 2000,
        description: "Join me for an invigorating morning yoga session facing the Annapurna range.",
        location: "Pokhara, Nepal",
        images: [
          "https://loremflickr.com/1000/600/yoga,sunrise?lock=46",
          "https://loremflickr.com/1000/600/yoga,sunrise?lock=47",
          "https://loremflickr.com/1000/600/yoga,sunrise?lock=48",
          "https://loremflickr.com/1000/600/yoga,sunrise?lock=49",
          "https://loremflickr.com/1000/600/yoga,sunrise?lock=50"
        ],
        duration: "2 hours", yearsOfExperience: 8, maxGuests: 10, isPublished: true,
      },
      {
        hostId,
        title: "Historic Patan Durbar Square Walk",
        category: "Culture",
        price: 1000,
        description: "A guided walking tour decoding the myths and art of Patan.",
        location: "Lalitpur, Nepal",
        images: [
          "https://loremflickr.com/1000/600/heritage,walk?lock=51",
          "https://loremflickr.com/1000/600/heritage,walk?lock=52",
          "https://loremflickr.com/1000/600/heritage,walk?lock=53",
          "https://loremflickr.com/1000/600/heritage,walk?lock=54",
          "https://loremflickr.com/1000/600/heritage,walk?lock=55"
        ],
        duration: "3 hours", yearsOfExperience: 10, maxGuests: 8, isPublished: true,
      },
      {
        hostId,
        title: "Everest Scenic Flight Adventure",
        category: "Adventure",
        price: 20000,
        description: "A magnificent morning mountain flight right up to Mount Everest.",
        location: "Kathmandu, Nepal",
        images: [
          "https://loremflickr.com/1000/600/helicopter,mountain?lock=56",
          "https://loremflickr.com/1000/600/helicopter,mountain?lock=57",
          "https://loremflickr.com/1000/600/helicopter,mountain?lock=58",
          "https://loremflickr.com/1000/600/helicopter,mountain?lock=59",
          "https://loremflickr.com/1000/600/helicopter,mountain?lock=60"
        ],
        duration: "1 hour", yearsOfExperience: 15, maxGuests: 15, isPublished: true,
      },
      {
        hostId,
        title: "Pottery Making Workshop",
        category: "Art & Culture",
        price: 1200,
        description: "Spin the wheel in Pottery Square and take home your creation.",
        location: "Bhaktapur, Nepal",
        images: [
          "https://loremflickr.com/1000/600/pottery,art?lock=61",
          "https://loremflickr.com/1000/600/pottery,art?lock=62",
          "https://loremflickr.com/1000/600/pottery,art?lock=63",
          "https://loremflickr.com/1000/600/pottery,art?lock=64",
          "https://loremflickr.com/1000/600/pottery,art?lock=65"
        ],
        duration: "2 hours", yearsOfExperience: 25, maxGuests: 4, isPublished: true,
      },
      {
        hostId,
        title: "Chitwan Jungle Safari on Foot",
        category: "Adventure",
        price: 3500,
        description: "Walk the remote trails of Chitwan in search of rhinos and tigers.",
        location: "Chitwan, Nepal",
        images: [
          "https://loremflickr.com/1000/600/safari,forest?lock=66",
          "https://loremflickr.com/1000/600/safari,forest?lock=67",
          "https://loremflickr.com/1000/600/safari,forest?lock=68",
          "https://loremflickr.com/1000/600/safari,forest?lock=69",
          "https://loremflickr.com/1000/600/safari,forest?lock=70"
        ],
        duration: "4 hours", yearsOfExperience: 12, maxGuests: 6, isPublished: true,
      },
      {
        hostId,
        title: "Thangka Painting Local Class",
        category: "Art",
        price: 2500,
        description: "Learn the ancient Buddhist art of Thangka painting from a Lama.",
        location: "Kathmandu, Nepal",
        images: [
          "https://loremflickr.com/1000/600/thangka,painting?lock=71",
          "https://loremflickr.com/1000/600/thangka,painting?lock=72",
          "https://loremflickr.com/1000/600/thangka,painting?lock=73",
          "https://loremflickr.com/1000/600/thangka,painting?lock=74",
          "https://loremflickr.com/1000/600/thangka,painting?lock=75"
        ],
        duration: "5 hours", yearsOfExperience: 20, maxGuests: 5, isPublished: true,
      },
      {
        hostId,
        title: "Traditional Nepali Thali Cooking",
        category: "Food & Drink",
        price: 1800,
        description: "Cook a perfect Dal Bhat Thali and learn local spices.",
        location: "Pokhara, Nepal",
        images: [
          "https://loremflickr.com/1000/600/thali,food?lock=76",
          "https://loremflickr.com/1000/600/thali,food?lock=77",
          "https://loremflickr.com/1000/600/thali,food?lock=78",
          "https://loremflickr.com/1000/600/thali,food?lock=79",
          "https://loremflickr.com/1000/600/thali,food?lock=80"
        ],
        duration: "3 hours", yearsOfExperience: 6, maxGuests: 8, isPublished: true,
      }
    ];

    await ExperienceModel.insertMany(experiences);

    console.log('Seed: Successfully seeded stays and experiences!');
  } catch (error) {
    console.error('Seed: Error seeding:', error);
  }
}

