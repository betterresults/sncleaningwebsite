const SERVICE_IMAGES = {
  'domestic-cleaning': '/images/services/domestic.jpg',
  'residential-cleaning': '/images/services/domestic.jpg',
  'end-of-tenancy-cleaning': '/images/services/tenancy.jpg',
  'airbnb-cleaning': '/images/services/airbnb.jpg',
  'deep-house-cleaning': '/images/services/deep.jpg',
  'after-builders-cleaning': '/images/services/builders.jpg',
  'carpet-upholstery-mattress-cleaning': '/images/services/carpet.jpg',
  'carpet-cleaning': '/images/services/carpet.jpg',
  'mattress-cleaning': '/images/rooms/room.jpg',
  'office-cleaning': '/images/services/office.jpg',
  'school-cleaning': '/images/services/school.jpg',
  'nursery-cleaning': '/images/services/nursery.jpg'
};

function serviceImage(slug) {
  if (!slug) return '/images/hero-living-room.jpg';
  if (SERVICE_IMAGES[slug]) return SERVICE_IMAGES[slug];

  const s = String(slug).toLowerCase();
  if (s.includes('domestic') || s.includes('residential')) return SERVICE_IMAGES['domestic-cleaning'];
  if (s.includes('tenancy') || s.includes('move')) return SERVICE_IMAGES['end-of-tenancy-cleaning'];
  if (s.includes('airbnb') || s.includes('holiday')) return SERVICE_IMAGES['airbnb-cleaning'];
  if (s.includes('deep')) return SERVICE_IMAGES['deep-house-cleaning'];
  if (s.includes('builder') || s.includes('construction')) return SERVICE_IMAGES['after-builders-cleaning'];
  if (s.includes('carpet') || s.includes('upholstery') || s.includes('mattress')) return SERVICE_IMAGES['carpet-cleaning'];
  if (s.includes('office') || s.includes('commercial')) return SERVICE_IMAGES['office-cleaning'];
  if (s.includes('school')) return SERVICE_IMAGES['school-cleaning'];
  if (s.includes('nursery') || s.includes('child')) return SERVICE_IMAGES['nursery-cleaning'];
  return '/images/hero-living-room.jpg';
}

const GALLERY = [
  { src: '/images/hero-living-room.jpg', caption: 'Living rooms' },
  { src: '/images/rooms/kitchen.jpg', caption: 'Kitchens' },
  { src: '/images/rooms/bathroom.jpg', caption: 'Bathrooms' },
  { src: '/images/rooms/room.jpg', caption: 'Bedrooms' },
  { src: '/images/services/airbnb.jpg', caption: 'Guest-ready stays' },
  { src: '/images/services/tenancy.jpg', caption: 'End of tenancy' },
  { src: '/images/services/office.jpg', caption: 'Offices' },
  { src: '/images/services/carpet.jpg', caption: 'Carpets & upholstery' },
  { src: '/images/services/deep.jpg', caption: 'Deep cleans' }
];

module.exports = { SERVICE_IMAGES, serviceImage, GALLERY };
