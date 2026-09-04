/**
 * serviceImages.js — High-resolution, individual image mappings for all 20 NEED services.
 * Ensures every single trade and appliance service has an authentic, distinct photograph.
 */

export const SERVICE_IMAGES_MAP = {
  // 1. Electrician
  electrician:
    'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80',
  
  // 2. Plumber
  plumber:
    'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=800&q=80',
  
  // 3. Carpenter
  carpenter:
    'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=800&q=80',
  
  // 4. Painter
  painter:
    'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=800&q=80',
  
  // 5. Cleaner / Deep Cleaning
  cleaner:
    'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80',
  
  // 6. Gardener
  gardener:
    'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=800&q=80',
  
  // 7. House Help
  'house-help':
    'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80',
  
  // 8. Caregiver / Elderly Care
  caregiver:
    'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=800&q=80',
  
  // 9. Driver
  driver:
    'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=800&q=80',
  
  // 10. Technician (General Maintenance)
  technician:
    'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
  
  // 11. AC Service
  'ac-service':
    'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=800&q=80',
  
  // 12. Refrigerator Service
  refrigerator:
    'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&w=800&q=80',
  
  // 13. Washing Machine Service
  'washing-machine':
    'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=800&q=80',
  
  // 14. TV Installation
  tv:
    'https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=800&q=80',
  
  // 15. Small Appliance Repair
  'appliance-repair':
    'https://images.unsplash.com/photo-1585338107529-13afc5f02586?auto=format&fit=crop&w=800&q=80',
  
  // 16. Car Washing
  'car-washing':
    'https://images.unsplash.com/photo-1601362840469-51e4d8d58785?auto=format&fit=crop&w=800&q=80',
  
  // 17. Construction Labour
  construction:
    'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80',
  
  // 18. Pest Control
  'pest-control':
    'https://images.unsplash.com/photo-1584744982491-665216d95f8b?auto=format&fit=crop&w=800&q=80',
  
  // 19. Pet Grooming
  'pet-grooming':
    'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&w=800&q=80',
  
  // 20. Barber
  barber:
    'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80',
}

/**
 * Returns the exact matched photograph URL for any given service object or string.
 * @param {object|string} service
 * @returns {string} Image URL
 */
export function getServiceImage(service) {
  if (!service) return SERVICE_IMAGES_MAP['technician']

  const name = (typeof service === 'string' ? service : service.name || '').toLowerCase().trim()
  const icon = (typeof service === 'object' && service.icon ? service.icon : '').toLowerCase().trim()
  const category = (typeof service === 'object' && service.category ? service.category : '').toLowerCase().trim()

  // 1. Direct Icon match
  if (icon && SERVICE_IMAGES_MAP[icon]) {
    return SERVICE_IMAGES_MAP[icon]
  }

  // 2. Keyword heuristic matches for names
  if (name.includes('ac') || name.includes('air condition') || icon.includes('ac')) {
    return SERVICE_IMAGES_MAP['ac-service']
  }
  if (name.includes('refrigerat') || name.includes('fridge') || icon.includes('fridge')) {
    return SERVICE_IMAGES_MAP['refrigerator']
  }
  if (name.includes('washing') || name.includes('laundry') || icon.includes('washing')) {
    return SERVICE_IMAGES_MAP['washing-machine']
  }
  if (name.includes('tv') || name.includes('television') || icon.includes('tv')) {
    return SERVICE_IMAGES_MAP['tv']
  }
  if (name.includes('appliance') || icon.includes('appliance')) {
    return SERVICE_IMAGES_MAP['appliance-repair']
  }
  if (name.includes('plumb') || icon.includes('plumb')) {
    return SERVICE_IMAGES_MAP['plumber']
  }
  if (name.includes('electr') || icon.includes('electr')) {
    return SERVICE_IMAGES_MAP['electrician']
  }
  if (name.includes('carpent') || icon.includes('carpent') || name.includes('wood')) {
    return SERVICE_IMAGES_MAP['carpenter']
  }
  if (name.includes('paint') || icon.includes('paint')) {
    return SERVICE_IMAGES_MAP['painter']
  }
  if (name.includes('clean') || icon.includes('clean')) {
    return SERVICE_IMAGES_MAP['cleaner']
  }
  if (name.includes('garden') || icon.includes('garden')) {
    return SERVICE_IMAGES_MAP['gardener']
  }
  if (name.includes('house') || name.includes('help') || name.includes('maid')) {
    return SERVICE_IMAGES_MAP['house-help']
  }
  if (name.includes('care') || name.includes('elder') || icon.includes('care')) {
    return SERVICE_IMAGES_MAP['caregiver']
  }
  if (name.includes('driv') || icon.includes('driver')) {
    return SERVICE_IMAGES_MAP['driver']
  }
  if (name.includes('car wash') || icon.includes('car-wash')) {
    return SERVICE_IMAGES_MAP['car-washing']
  }
  if (name.includes('construct') || name.includes('labour') || icon.includes('construct')) {
    return SERVICE_IMAGES_MAP['construction']
  }
  if (name.includes('pest') || icon.includes('pest')) {
    return SERVICE_IMAGES_MAP['pest-control']
  }
  if (name.includes('pet') || icon.includes('pet')) {
    return SERVICE_IMAGES_MAP['pet-grooming']
  }
  if (name.includes('barber') || name.includes('salon') || name.includes('hair')) {
    return SERVICE_IMAGES_MAP['barber']
  }

  // 3. Category fallbacks
  if (category.includes('appliance')) {
    return SERVICE_IMAGES_MAP['appliance-repair']
  }
  if (category.includes('home')) {
    return SERVICE_IMAGES_MAP['electrician']
  }

  return SERVICE_IMAGES_MAP['technician']
}
