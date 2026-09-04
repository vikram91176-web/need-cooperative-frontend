/**
 * serviceIcons.js — turns the backend's icon name into a real icon component.
 *
 * WHAT: The backend sends a text key like "electrician". This file maps that
 *       key to a Lucide icon.
 * WHY:  The database stays pure data — no images, no React inside it. And an
 *       admin can add a new service later without a code change; it just gets
 *       the default wrench icon until we add a nicer one here.
 * HOW:  `getServiceIcon('plumber')` returns the Droplets component.
 */

import {
  Bug,
  Car,
  Droplet,
  Droplets,
  Hammer,
  HardHat,
  HeartHandshake,
  Home,
  Paintbrush,
  Plug,
  Scissors,
  Shirt,
  Snowflake,
  Sparkles,
  Sprout,
  Tv,
  Wind,
  Wrench,
  Zap,
  Dog,
} from 'lucide-react'

const ICONS = {
  electrician: Zap,
  plumber: Droplets,
  carpenter: Hammer,
  painter: Paintbrush,
  cleaner: Sparkles,
  gardener: Sprout,
  'house-help': Home,
  caregiver: HeartHandshake,
  driver: Car,
  technician: Wrench,

  'ac-service': Wind,
  refrigerator: Snowflake,
  'washing-machine': Shirt,
  tv: Tv,
  'appliance-repair': Plug,

  'car-washing': Droplet,
  construction: HardHat,
  'pest-control': Bug,
  'pet-grooming': Dog,
  barber: Scissors,
}

/**
 * Always returns a component, never undefined.
 * A missing icon must never be allowed to crash the page.
 */
export function getServiceIcon(iconName) {
  return ICONS[iconName] || Wrench
}
